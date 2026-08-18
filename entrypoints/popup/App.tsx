import { useEffect, useState } from 'preact/hooks';
import { AsYouType, type CountryCode } from 'libphonenumber-js/min';
import { validateToE164 } from '../../lib/phone/validate';
import { formatCallTime, formatE164 } from '../../lib/phone/format';
import { t } from '../../lib/i18n';
import {
  getConfig,
  getHistory,
  clearHistory,
  setSiteEnabled,
  isSiteEnabled,
  loadLastCall,
  type CallHistoryEntry,
  type Config,
  type LastCallRecord,
} from '../../lib/storage';
import type { HealthSnapshot } from '../../lib/diagnostics/health';
import type { Message } from '../../lib/messaging/schema';

type Health = 'unconfigured' | 'ready';

/** One-line trail of the last dialling attempt, e.g. "ccapi ✗ (makecall 401) → deeplink ✓". */
function attemptTrail(rec: LastCallRecord): string {
  if (!rec.attempts.length) return `${rec.strategy} ${rec.ok ? '✓' : '✗'}`;
  return rec.attempts
    .map((a) => `${a.strategy} ${a.ok ? '✓' : '✗'}${a.reason ? ` (${a.reason})` : ''}`)
    .join(' → ');
}

async function activeHost(): Promise<string | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  try {
    const url = new URL(tab.url);
    // The per-site toggle only makes sense for web pages — not chrome://,
    // extension pages or the Web Store.
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.host;
  } catch {
    return null;
  }
}

export function App() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [host, setHost] = useState<string | null>(null);
  const [siteOn, setSiteOn] = useState(true);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CallHistoryEntry[]>([]);
  const [lastCall, setLastCall] = useState<LastCallRecord | null>(null);
  const [snap, setSnap] = useState<HealthSnapshot | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void (async () => {
      const c = await getConfig();
      setCfg(c);
      setHistory(await getHistory());
      setLastCall(await loadLastCall());
      const h = await activeHost();
      setHost(h);
      if (h) setSiteOn(isSiteEnabled(c, h));
    })();
  }, []);

  if (!cfg) return <div class="pad">{t('common_loading')}</div>;

  const health: Health = cfg.fqdn ? 'ready' : 'unconfigured';
  const region = cfg.defaultRegion as CountryCode;
  const formatted = new AsYouType(region).input(input);
  const e164 = validateToE164(input, region);

  const call = async (num: string) => {
    const msg: Message = { type: 'PLACE_CALL', e164: num };
    await browser.runtime.sendMessage(msg);
    setHistory(await getHistory());
    setLastCall(await loadLastCall());
  };

  const runHealth = async () => {
    setChecking(true);
    try {
      const msg: Message = { type: 'HEALTH_CHECK' };
      setSnap((await browser.runtime.sendMessage(msg)) as HealthSnapshot);
    } finally {
      setChecking(false);
    }
  };

  const yesNo = (v: boolean | null) =>
    v === null ? t('diag_na') : v ? t('diag_yes') : t('diag_no');

  const toggleSite = async () => {
    if (!host) return;
    const next = !siteOn;
    setSiteOn(next);
    await setSiteEnabled(host, next);
  };

  return (
    <div class="popup">
      <header class="row between">
        <strong>
          TrueDial <span class="muted">for 3CX</span>
        </strong>
        <div class="row">
          <span class="status small muted">
            <span class={`dot ${health}`} />
            {health === 'ready' ? t('popup_statusReady') : t('popup_statusUnconfigured')}
          </span>
          <button
            class="icon"
            title={t('popup_settings')}
            aria-label={t('popup_settings')}
            onClick={() => browser.runtime.openOptionsPage()}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path
                fill="currentColor"
                d="M19.14 12.94a7.5 7.5 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.65 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.12.21.37.29.6.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.04.24.25.42.5.42h3.84c.25 0 .46-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.23.07.48-.01.6-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7"
              />
            </svg>
          </button>
        </div>
      </header>

      {health === 'unconfigured' && (
        <button class="cta" onClick={() => browser.runtime.openOptionsPage()}>
          {t('popup_configure')}
        </button>
      )}

      <label class="field">
        <span class="muted small">{t('popup_dialLabel')}</span>
        <input
          type="tel"
          value={formatted}
          placeholder={t('popup_dialPlaceholder')}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
        />
        <div class="small">
          {input &&
            (e164 ? (
              <span class="ok">✓ {e164}</span>
            ) : (
              <span class="err">{t('popup_invalid')}</span>
            ))}
        </div>
      </label>
      <button
        class="cta"
        disabled={!e164 || health === 'unconfigured'}
        onClick={() => e164 && call(e164)}
      >
        {t('popup_call')}
      </button>

      {host && (
        <label class="row between toggle">
          <span class="small">
            {t('popup_detectionOn')} <b>{host}</b>
          </span>
          <input type="checkbox" checked={siteOn} onChange={toggleSite} />
        </label>
      )}

      {lastCall && (
        <div class="small" title={attemptTrail(lastCall)}>
          <span class="muted">{t('popup_lastCall')}: </span>
          <span class={lastCall.ok ? 'ok' : 'err'}>
            {lastCall.strategy} {lastCall.ok ? (lastCall.unconfirmed ? '≈' : '✓') : '✗'}
          </span>
          {lastCall.attempts.length > 1 && (
            <span class="muted mono"> · {attemptTrail(lastCall)}</span>
          )}
        </div>
      )}

      {health === 'ready' && (
        <div class="small">
          <button class="mini" disabled={checking} onClick={runHealth}>
            {checking ? t('diag_checking') : t('diag_runHealth')}
          </button>
          {snap && (
            <div class="muted">
              {t('diag_reachable')} {yesNo(snap.reachable)} · {t('diag_token')}{' '}
              {yesNo(snap.tokenOk)} · {t('diag_activePath')} {snap.recommended ?? t('diag_none')}
            </div>
          )}
        </div>
      )}

      <section>
        <div class="row between">
          <span class="muted small">{t('popup_history')}</span>
          {history.length > 0 && (
            <button
              class="link"
              onClick={async () => {
                await clearHistory();
                setHistory([]);
              }}
            >
              {t('popup_clear')}
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div class="small muted">{t('popup_noCalls')}</div>
        ) : (
          <ul class="history">
            {history.slice(0, 8).map((h) => (
              <li class="row between" key={`${h.e164}-${h.ts}`}>
                <button class="link" onClick={() => call(h.e164)} title={h.e164}>
                  {formatE164(h.e164)}
                </button>
                <span class={`small ${h.status === 'failed' ? 'err' : 'muted'}`}>
                  {h.status === 'attempted' && (
                    <span title={t('popup_attempted')} aria-label={t('popup_attempted')}>
                      ≈{' '}
                    </span>
                  )}
                  {formatCallTime(h.ts)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
