import { defineBackground } from 'wxt/sandbox';
import { type Runtime } from 'wxt/browser';
import { parseMessage, type Message } from '../lib/messaging/schema';
import { CallOrchestrator } from '../lib/call/orchestrator';
import { DeepLinkStrategy } from '../lib/call/deeplink';
import { validateToE164 } from '../lib/phone/validate';
import {
  getConfig,
  setSiteEnabled,
  pushHistory,
  isSiteEnabled,
  type Config,
} from '../lib/storage';

// Service worker: router komunikatów + CallOrchestrator + context menu.
// Cały stan żyje w browser.storage — SW jest w pełni restartowalny (MV3).
export default defineBackground(() => {
  // Orchestrator budowany leniwie z aktualnego FQDN (SW mógł zostać wybudzony).
  const orchestrator = new CallOrchestrator([
    new DeepLinkStrategy(async () => (await getConfig()).fqdn),
  ]);

  async function placeCall(e164: string, source?: string): Promise<void> {
    const outcome = await orchestrator.placeCall(e164);
    await pushHistory({
      e164,
      ts: Date.now(),
      source,
      status: outcome.ok ? 'placed' : 'failed',
    });
  }

  // --- Context menu: prawy-klik na zaznaczeniu → zadzwoń (§3.F2) ---
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'truedial-call',
      title: 'Zadzwoń przez 3CX: „%s”',
      contexts: ['selection'],
    });
  });

  browser.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== 'truedial-call' || !info.selectionText) return;
    const cfg = await getConfig();
    const e164 = validateToE164(info.selectionText.trim(), cfg.defaultRegion);
    if (e164) await placeCall(e164, info.pageUrl);
  });

  // --- Router komunikatów (content/popup/options) ---
  // Zwrócenie Promise → polyfill odsyła rozwiązaną wartość jako odpowiedź;
  // zwrócenie undefined → wiadomość nieobsłużona.
  browser.runtime.onMessage.addListener((raw: unknown, sender: Runtime.MessageSender) => {
    // Zaufanie: wiadomość musi pochodzić z NASZEGO rozszerzenia.
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
