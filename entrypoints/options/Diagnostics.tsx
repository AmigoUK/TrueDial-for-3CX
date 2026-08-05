import { useEffect, useState } from 'preact/hooks';
import { getConfig } from '../../lib/storage';
import { getEvents, clearEvents } from '../../lib/diagnostics/service';
import { buildReport, type DiagEvent } from '../../lib/diagnostics/events';
import type { HealthSnapshot } from '../../lib/diagnostics/health';
import type { Message } from '../../lib/messaging/schema';
import { t } from '../../lib/i18n';

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

  const yesNo = (v: boolean | null): string =>
    v === null ? t('diag_na') : v ? t('diag_yes') : t('diag_no');

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
      <h2>{t('diag_title')}</h2>
      <p class="hint">{t('diag_hint')}</p>

      <div class="row" style="gap:10px;margin-bottom:12px">
        <button class="ghost" onClick={runHealth} disabled={checking}>
          {checking ? t('diag_checking') : t('diag_runHealth')}
        </button>
        <button class="ghost" onClick={copyReport}>
          {t('diag_copyReport')}
        </button>
        <button
          class="ghost"
          onClick={async () => {
            await clearEvents();
            await refresh();
          }}
        >
          {t('diag_clear')}
        </button>
        {copied && <span class="ok">{t('diag_copied')}</span>}
      </div>

      {health && (
        <div class="health">
          <span>
            {t('diag_reachable')} <b>{yesNo(health.reachable)}</b>
          </span>
          <span>
            {t('diag_token')} <b>{yesNo(health.tokenOk)}</b>
          </span>
          <span>
            {t('diag_activePath')} <b>{health.recommended ?? t('diag_none')}</b>
          </span>
          <span>
            {t('diag_configured')} <b>{health.configured.join(', ')}</b>
          </span>
        </div>
      )}

      {events.length === 0 ? (
        <p class="hint">{t('diag_noEvents')}</p>
      ) : (
        <ul class="diag">
          {[...events]
            .reverse()
            .slice(0, 20)
            .map((e) => (
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
