import { defineContentScript } from 'wxt/sandbox';
import { Scanner } from '../lib/scanner/scanner';
import { Renderer } from '../lib/renderer/renderer';
import { getConfig, isSiteEnabled } from '../lib/storage';
import type { Message } from '../lib/messaging/schema';

// Content script (all_frames): TYLKO detekcja + prezentacja. Nie zna sekretów,
// nie woła API 3CX — dzwonienie deleguje do SW komunikatem PLACE_CALL.
export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_idle',
  async main() {
    const host = location.host;
    const cfg = await getConfig();
    if (cfg.detectionMode === 'off' || !isSiteEnabled(cfg, host)) return;

    const placeCall = (e164: string): void => {
      const msg: Message = { type: 'PLACE_CALL', e164, source: location.href };
      browser.runtime.sendMessage(msg).catch(() => {});
    };

    const renderer = new Renderer(placeCall);
    const scanner = new Scanner({
      defaultRegion: cfg.defaultRegion,
      onMatches: (matches) => renderer.apply(matches),
    });

    // Aktywacja klawiaturą (dostępność): Enter/Spacja na podświetleniu.
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const el = (ev.target as Element | null)?.closest?.('[data-truedial]');
      const e164 = el?.getAttribute('data-e164');
      if (e164) {
        ev.preventDefault();
        placeCall(e164);
      }
    });

    const startWhenReady = () => scanner.start(document.body);
    if (document.body) startWhenReady();
    else document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });

    // Per-site toggle / zmiana trybu z popupu → przeładuj kartę, by odzwierciedlić.
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.config) location.reload();
    });
  },
});
