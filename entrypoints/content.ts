import { defineContentScript } from 'wxt/sandbox';
import { Scanner } from '../lib/scanner/scanner';
import { Renderer } from '../lib/renderer/renderer';
import { getConfig, isSiteEnabled, detectionSettingsChanged } from '../lib/storage';
import type { Message } from '../lib/messaging/schema';

// Content script (all_frames): detection and presentation ONLY. It holds no
// secrets and calls no 3CX API — it delegates dialling to the SW via a
// PLACE_CALL message.
export default defineContentScript({
  // Registered at RUNTIME by the background worker for exactly the origins the
  // user granted (lib/permissions/registration.ts) — never in the manifest, so
  // there is no install-time "read data on all websites" warning. `matches`
  // here is only WXT metadata; the real matches come from the registration.
  //
  // Exception: the E2E build (TRUEDIAL_E2E=1) registers statically, because a
  // headless browser cannot accept the optional-permission prompt. Production
  // builds and the store package always use runtime registration.
  matches: ['<all_urls>'],
  registration: import.meta.env.TRUEDIAL_E2E === '1' ? 'manifest' : 'runtime',
  allFrames: true,
  runAt: 'document_idle',
  async main() {
    const host = location.host;
    let scanner: Scanner | null = null;
    let renderer: Renderer | null = null;

    const placeCall = (e164: string): void => {
      const msg: Message = { type: 'PLACE_CALL', e164, source: location.href };
      browser.runtime.sendMessage(msg).catch(() => {});
    };

    // Report this frame's detected-number count to the SW for the toolbar
    // badge (the SW sums the counts across frames).
    const reportCount = (n: number): void => {
      const msg: Message = { type: 'DETECTION_COUNT', count: n };
      browser.runtime.sendMessage(msg).catch(() => {});
    };

    const start = async (): Promise<void> => {
      const cfg = await getConfig();
      if (cfg.detectionMode === 'off' || !isSiteEnabled(cfg, host)) return;

      const r = new Renderer(
        placeCall,
        cfg.detectionMode === 'aggressive' ? 'aggressive' : 'subtle',
      );
      const s = new Scanner({
        defaultRegion: cfg.defaultRegion,
        onMatches: (matches) => {
          r.apply(matches);
          // The scanner's capped count is authoritative — an accumulated sum
          // here would double-count incremental mutation scans.
          reportCount(s.count);
        },
        onOverflow: (total) => reportCount(total),
      });
      renderer = r;
      scanner = s;

      const startWhenReady = () => s.start(document.body);
      if (document.body) startWhenReady();
      else document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });
    };

    const stop = (): void => {
      scanner?.stop();
      scanner = null;
      renderer?.teardown();
      renderer = null;
      reportCount(0);
    };

    // Keyboard activation (accessibility): Enter/Space on a highlight.
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const el = (ev.target as Element | null)?.closest?.('[data-truedial]');
      const e164 = el?.getAttribute('data-e164');
      if (e164) {
        ev.preventDefault();
        placeCall(e164);
      }
    });

    await start();

    // React to config changes in place — never location.reload(), which would
    // discard the host page's state (unsaved forms, scroll position) on every
    // save. Only detection-relevant changes trigger a teardown + re-scan.
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.config) return;
      if (!detectionSettingsChanged(changes.config.oldValue, changes.config.newValue)) return;
      stop();
      void start();
    });
  },
});
