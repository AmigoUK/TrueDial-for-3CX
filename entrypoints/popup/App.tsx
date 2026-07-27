import { useEffect, useState } from 'preact/hooks';
import { AsYouType, type CountryCode } from 'libphonenumber-js/min';
import { validateToE164 } from '../../lib/phone/validate';
import {
  getConfig,
  getHistory,
  clearHistory,
  setSiteEnabled,
  isSiteEnabled,
  type CallHistoryEntry,
  type Config,
} from '../../lib/storage';
import type { Message } from '../../lib/messaging/schema';

type Health = 'unconfigured' | 'ready';

async function activeHost(): Promise<string | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  try {
    return new URL(tab.url).host;
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

  useEffect(() => {
    void (async () => {
      const c = await getConfig();
      setCfg(c);
      setHistory(await getHistory());
      const h = await activeHost();
      setHost(h);
      if (h) setSiteOn(isSiteEnabled(c, h));
    })();
  }, []);

  if (!cfg) return <div class="pad">Ładowanie…</div>;

  const health: Health = cfg.fqdn ? 'ready' : 'unconfigured';
  const region = cfg.defaultRegion as CountryCode;
  const formatted = new AsYouType(region).input(input);
  const e164 = validateToE164(input, region);

  const call = async (num: string) => {
    const msg: Message = { type: 'PLACE_CALL', e164: num };
    await browser.runtime.sendMessage(msg);
    setHistory(await getHistory());
  };

  const toggleSite = async () => {
    if (!host) return;
    const next = !siteOn;
    setSiteOn(next);
    await setSiteEnabled(host, next);
  };

  return (
    <div class="popup">
      <header class="row between">
        <strong>TrueDial <span class="muted">for 3CX</span></strong>
        <span class={`dot ${health}`} title={health} />
      </header>

      {health === 'unconfigured' && (
        <button class="cta" onClick={() => browser.runtime.openOptionsPage()}>
          Skonfiguruj połączenie z 3CX →
        </button>
      )}

      <label class="field">
        <span class="muted small">Wybierz numer</span>
        <input
          type="tel"
          value={formatted}
          placeholder="np. +48 22 123 45 67"
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
        />
        <div class="small">
          {input && (e164 ? <span class="ok">✓ {e164}</span> : <span class="err">Niepoprawny numer</span>)}
        </div>
      </label>
      <button class="cta" disabled={!e164 || health === 'unconfigured'} onClick={() => e164 && call(e164)}>
        Zadzwoń
      </button>

      {host && (
        <label class="row between toggle">
          <span class="small">Detekcja na <b>{host}</b></span>
          <input type="checkbox" checked={siteOn} onChange={toggleSite} />
        </label>
      )}

      <section>
        <div class="row between">
          <span class="muted small">Historia</span>
          {history.length > 0 && (
            <button
              class="link"
              onClick={async () => {
                await clearHistory();
                setHistory([]);
              }}
            >
              wyczyść
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div class="small muted">Brak połączeń.</div>
        ) : (
          <ul class="history">
            {history.slice(0, 8).map((h) => (
              <li class="row between" key={`${h.e164}-${h.ts}`}>
                <button class="link mono" onClick={() => call(h.e164)}>{h.e164}</button>
                <span class={`small ${h.status === 'failed' ? 'err' : 'muted'}`}>
                  {new Date(h.ts).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
