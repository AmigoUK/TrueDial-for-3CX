import { useEffect, useState } from 'preact/hooks';
import { getConfig } from '../../lib/storage';
import { getEvents, clearEvents } from '../../lib/diagnostics/service';
import { buildReport, type DiagEvent } from '../../lib/diagnostics/events';
import type { HealthSnapshot } from '../../lib/diagnostics/health';
import type { Message } from '../../lib/messaging/schema';

// Diagnostics panel (§3.F4): the always-on local ring buffer plus a one-click
// anonymised report the user can paste into an IT ticket. This is what replaces
// telemetry — nothing leaves the browser unless the user copies it.
export function Diagnostics() {
  const [events, setEvents] = useState<DiagEvent[]>([]);
  const [copied, setCopied] = useState(false);
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [checking, setChecking] = useState(false);

  const refresh = async () => setEvents(await getEvents());

  useEffect(() => {
    void refresh();
  }, []);

  const runHealth = async () => {
    setChecking(true);
    const msg: Message = { type: 'HEALTH_CHECK' };
    const snap = (await browser.runtime.sendMessage(msg)) as HealthSnapshot;
    setHealth(snap);
    setChecking(false);
    await refresh();
  };

  const yesNo = (v: boolean | null): string => (v === null ? 'n/d' : v ? 'tak' : 'nie');

  const copyReport = async () => {
    const cfg = await getConfig();
    const report = buildReport({
      version: browser.runtime.getManifest().version,
      fqdnConfigured: Boolean(cfg.fqdn),
      region: cfg.defaultRegion,
      preferredPath: cfg.preferredPath,
      detectionMode: cfg.detectionMode,
      events: await getEvents(),
    });
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section>
      <h2>Diagnostyka</h2>
      <p class="hint">
        Lokalny bufor ostatnich zdarzeń. Raport jest zanonimizowany (numery i
        adresy URL są maskowane) — nic nie opuszcza przeglądarki bez Twojej akcji.
      </p>

      <div class="row" style="gap:10px;margin-bottom:12px">
        <button class="ghost" onClick={runHealth} disabled={checking}>
          {checking ? 'Testuję…' : 'Uruchom test łączności'}
        </button>
        <button class="ghost" onClick={copyReport}>Kopiuj raport diagnostyczny</button>
        <button
          class="ghost"
          onClick={async () => {
            await clearEvents();
            await refresh();
          }}
        >
          Wyczyść
        </button>
        {copied && <span class="ok">✓ Skopiowano</span>}
      </div>

      {health && (
        <div class="health">
          <span>PBX osiągalny: <b>{yesNo(health.reachable)}</b></span>
          <span>Token API: <b>{yesNo(health.tokenOk)}</b></span>
          <span>Aktywna ścieżka: <b>{health.recommended ?? 'brak (nieskonfigurowane)'}</b></span>
          <span>Skonfigurowane: <b>{health.configured.join(', ')}</b></span>
        </div>
      )}

      {events.length === 0 ? (
        <p class="hint">Brak zdarzeń.</p>
      ) : (
        <ul class="diag">
          {[...events].reverse().slice(0, 20).map((e) => (
            <li key={e.ts} class={`diag-${e.level}`}>
              <span class="mono small">{new Date(e.ts).toLocaleTimeString()}</span>
              <span class="small">{e.kind}</span>
              <span class="small">{e.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
