import { defineContentScript } from 'wxt/sandbox';
import { Scanner } from '../lib/scanner/scanner';
import { Renderer } from '../lib/renderer/renderer';
import { getConfig, isSiteEnabled } from '../lib/storage';
import type { Message } from '../lib/messaging/schema';

// Content script (all_frames): detection and presentation ONLY. It holds no
// secrets and calls no 3CX API — it delegates dialling to the SW via a
// PLACE_CALL message.
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

    const renderer = new Renderer(placeCall, cfg.detectionMode === 'aggressive' ? 'aggressive' : 'subtle');

    // Report the running detected-number count to the SW for the toolbar badge.
    let detected = 0;
    const reportCount = (n: number): void => {
      const msg: Message = { type: 'DETECTION_COUNT', count: n };
      browser.runtime.sendMessage(msg).catch(() => {});
    };

    const scanner = new Scanner({
      defaultRegion: cfg.defaultRegion,
      onMatches: (matches) => {
        renderer.apply(matches);
        detected += matches.length;
        reportCount(detected);
      },
      onOverflow: (total) => reportCount(total),
    });

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

    const startWhenReady = () => scanner.start(document.body);
    if (document.body) startWhenReady();
    else document.addEventListener('DOMContentLoaded', startWhenReady, { once: true });

    // A per-site toggle / mode change from the popup → reload the tab to reflect it.
    browser.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.config) location.reload();
    });
  },
});
