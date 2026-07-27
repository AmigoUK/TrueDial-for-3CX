import { defineBackground } from 'wxt/sandbox';
import { type Runtime } from 'wxt/browser';
import { parseMessage, type Message } from '../lib/messaging/schema';
import { CallOrchestrator } from '../lib/call/orchestrator';
import { DeepLinkStrategy } from '../lib/call/deeplink';
import { TelStrategy } from '../lib/call/tel';
import { CallControlStrategy } from '../lib/call/ccapi';
import { TokenManager } from '../lib/call/token';
import { orderStrategyIds } from '../lib/call/select';
import type { CallStrategy, StrategyId } from '../lib/call/strategy';
import { validateToE164 } from '../lib/phone/validate';
import { buildScreenPopUrl } from '../lib/crm/template';
import { recordEvent } from '../lib/diagnostics/service';
import {
  getConfig,
  setSiteEnabled,
  pushHistory,
  isSiteEnabled,
  loadCcToken,
  saveCcToken,
  type Config,
} from '../lib/storage';

// Service worker: message router + CallOrchestrator + context menu.
// All state lives in browser.storage — the SW is fully restartable (MV3).
export default defineBackground(() => {
  // Instantiate a strategy by id. New paths (e.g. 'ccapi') slot in here.
  function makeStrategy(id: StrategyId): CallStrategy | null {
    switch (id) {
      case 'ccapi':
        return new CallControlStrategy(async () => {
          const c = await getConfig();
          return { fqdn: c.fqdn, extension: c.ccExtension, deviceId: c.ccDeviceId };
        }, ccapiTokenProvider());
      case 'deeplink':
        return new DeepLinkStrategy(async () => (await getConfig()).fqdn);
      case 'tel':
        return new TelStrategy();
      default:
        return null;
    }
  }

  // A TokenProvider that reads FQDN + credentials from the live config on each
  // refresh (the SW may have been woken with a changed config).
  function ccapiTokenProvider() {
    return {
      async getToken(force = false): Promise<string> {
        const c = await getConfig();
        const tm = new TokenManager({
          fqdn: c.fqdn ?? '',
          clientId: c.clientId ?? '',
          clientSecret: c.clientSecret ?? '',
          load: loadCcToken,
          save: saveCcToken,
        });
        return tm.getToken(force);
      },
    };
  }

  // Built per call from the current config (the SW may have been woken).
  async function makeOrchestrator(): Promise<CallOrchestrator> {
    const cfg = await getConfig();
    const strategies = orderStrategyIds(cfg.preferredPath)
      .map(makeStrategy)
      .filter((s): s is CallStrategy => s !== null);
    return new CallOrchestrator(strategies);
  }

  async function placeCall(e164: string, source?: string): Promise<void> {
    const orchestrator = await makeOrchestrator();
    const outcome = await orchestrator.placeCall(e164);
    await pushHistory({
      e164,
      ts: Date.now(),
      source,
      status: outcome.ok ? 'placed' : 'failed',
    });
    // Diagnostics: numbers are redacted at report time, so we can log freely.
    if (outcome.ok) {
      await recordEvent('call', 'info', `call placed via ${outcome.strategy}`);
      await maybeScreenPop(e164);
    } else {
      await recordEvent('call', 'error', `call failed (${outcome.strategy}): ${outcome.reason}`);
    }
  }

  // Screen-pop (§3.F5): on an outgoing call, open the configured CRM URL in a
  // background tab. Disabled when the template is empty or has no placeholder.
  async function maybeScreenPop(e164: string): Promise<void> {
    const { screenPopUrl } = await getConfig();
    const url = buildScreenPopUrl(screenPopUrl, e164);
    if (!url) return;
    await browser.tabs.create({ url, active: false });
    await recordEvent('call', 'info', 'screen-pop opened');
  }

  // --- Context menu: right-click on a selection → call (§3.F2) ---
  browser.runtime.onInstalled.addListener((details) => {
    browser.contextMenus.create({
      id: 'truedial-call',
      title: 'Zadzwoń przez 3CX: „%s”',
      contexts: ['selection'],
    });
    void recordEvent('lifecycle', 'info', `installed/updated (${details.reason})`);
  });

  browser.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== 'truedial-call' || !info.selectionText) return;
    const cfg = await getConfig();
    const e164 = validateToE164(info.selectionText.trim(), cfg.defaultRegion);
    if (e164) await placeCall(e164, info.pageUrl);
  });

  // --- Message router (content/popup/options) ---
  // Returning a Promise → the polyfill sends the resolved value as the response;
  // returning undefined → the message is not handled.
  browser.runtime.onMessage.addListener((raw: unknown, sender: Runtime.MessageSender) => {
    // Trust: the message must originate from OUR extension.
    if (sender.id !== browser.runtime.id) return undefined;
    const msg = parseMessage(raw);
    if (!msg) return undefined;
    return handle(msg);
  });

  async function handle(msg: Message): Promise<unknown> {
    switch (msg.type) {
      case 'PLACE_CALL':
        await placeCall(msg.e164, msg.source);
        return { ok: true };
      case 'GET_CONFIG':
        return await getConfig();
      case 'SET_SITE_ENABLED':
        await setSiteEnabled(msg.host, msg.enabled);
        return { ok: true };
      case 'GET_SITE_ENABLED': {
        const cfg: Config = await getConfig();
        return { enabled: isSiteEnabled(cfg, msg.host) };
      }
    }
  }
});
