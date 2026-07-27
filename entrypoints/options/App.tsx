import { useEffect, useState } from 'preact/hooks';
import type { CountryCode } from 'libphonenumber-js/min';
import {
  getConfig,
  setConfig,
  exportConfig,
  importConfig,
  type Config,
  type DetectionMode,
} from '../../lib/storage';
import { normalizeFqdn, buildDeepLinkUrl } from '../../lib/call/deeplink';
import type { PreferredPath } from '../../lib/call/select';
import { Diagnostics } from './Diagnostics';
import { AppFooter } from '../../components/AppFooter';

// Curated region list (a picker, not free text) — the most common 3CX SMB markets.
const REGIONS: { code: CountryCode; label: string }[] = [
  { code: 'GB', label: 'United Kingdom (+44)' },
  { code: 'PL', label: 'Polska (+48)' },
  { code: 'DE', label: 'Deutschland (+49)' },
  { code: 'FR', label: 'France (+33)' },
  { code: 'ES', label: 'España (+34)' },
  { code: 'IT', label: 'Italia (+39)' },
  { code: 'NL', label: 'Nederland (+31)' },
  { code: 'US', label: 'United States (+1)' },
  { code: 'IE', label: 'Ireland (+353)' },
];

function suggestRegion(): CountryCode {
  const loc = navigator.language.split('-')[1]?.toUpperCase();
  return (REGIONS.find((r) => r.code === loc)?.code ?? 'GB') as CountryCode;
}

export function App() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [saved, setSaved] = useState(false);
  const [importErr, setImportErr] = useState(false);

  useEffect(() => {
    void (async () => {
      const c = await getConfig();
      if (!c.fqdn && !c.defaultRegion) c.defaultRegion = suggestRegion();
      setCfg(c);
    })();
  }, []);

  if (!cfg) return <div class="pad">Ładowanie…</div>;

  const update = (patch: Partial<Config>) => setCfg({ ...cfg, ...patch });

  const save = async () => {
    const clean: Partial<Config> = {
      ...cfg,
      fqdn: cfg.fqdn ? normalizeFqdn(cfg.fqdn) : undefined,
    };
    setCfg(await setConfig(clean));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const grantAllUrls = async () => {
    await browser.permissions.request({ origins: ['<all_urls>'] });
  };

  const testDeepLink = () => {
    if (cfg.fqdn) browser.tabs.create({ url: buildDeepLinkUrl(cfg.fqdn, '+000000000') });
  };

  const doExport = () => {
    const blob = new Blob([exportConfig(cfg)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'truedial-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const patch = importConfig(await file.text());
    setImportErr(patch === null);
    if (patch) {
      setCfg(await setConfig(patch));
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  };

  return (
    <div class="shell">
      <main class="card">
        <h1>TrueDial <span class="muted">for 3CX</span></h1>
        <p class="muted">
          Niezależne rozszerzenie click-to-call. Nie jest powiązane z 3CX.
        </p>

        <section>
          <h2>Połączenie z 3CX</h2>
          <label class="field">
            <span>FQDN instancji 3CX</span>
            <input
              type="text"
              placeholder="pbx.twojafirma.pl lub pbx.twojafirma.pl:5001"
              value={cfg.fqdn ?? ''}
              onInput={(e) => update({ fqdn: (e.target as HTMLInputElement).value })}
            />
            <span class="hint">
              Ścieżka MVP: deep-link web clienta (bez konfiguracji admina).
            </span>
          </label>
          <button class="ghost" disabled={!cfg.fqdn} onClick={testDeepLink}>
            Testuj deep-link
          </button>

          <label class="field">
            <span>Preferowana ścieżka połączenia</span>
            <select
              value={cfg.preferredPath}
              onChange={(e) => update({ preferredPath: (e.target as HTMLSelectElement).value as PreferredPath })}
            >
              <option value="auto">Automatycznie (Call Control API → deep-link → tel:)</option>
              <option value="ccapi">Tylko Call Control API</option>
              <option value="deeplink">Tylko deep-link web clienta</option>
              <option value="tel">Tylko tel: (aplikacja desktopowa)</option>
            </select>
            <span class="hint">
              Przy niepowodzeniu ścieżki rozszerzenie schodzi do następnej — bez cichych awarii.
            </span>
          </label>
        </section>

        <section>
          <h2>Call Control API (opcjonalnie)</h2>
          <p class="hint">
            Pełny status połączenia. Wymaga aplikacji API w konsoli 3CX
            (Admin → Integrations → API) oraz odpowiedniej licencji. Poświadczenia
            są przechowywane lokalnie i nigdy nie są synchronizowane.
          </p>
          <label class="field">
            <span>Client ID</span>
            <input
              type="text"
              value={cfg.clientId ?? ''}
              onInput={(e) => update({ clientId: (e.target as HTMLInputElement).value })}
            />
          </label>
          <label class="field">
            <span>Client Secret</span>
            <input
              type="password"
              autocomplete="off"
              value={cfg.clientSecret ?? ''}
              onInput={(e) => update({ clientSecret: (e.target as HTMLInputElement).value })}
            />
          </label>
          <div class="row" style="gap:12px">
            <label class="field" style="flex:1">
              <span>Numer wewnętrzny (ext.)</span>
              <input
                type="text"
                placeholder="np. 100"
                value={cfg.ccExtension ?? ''}
                onInput={(e) => update({ ccExtension: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="field" style="flex:1">
              <span>Device ID</span>
              <input
                type="text"
                placeholder="z GET /callcontrol/{ext}/devices"
                value={cfg.ccDeviceId ?? ''}
                onInput={(e) => update({ ccDeviceId: (e.target as HTMLInputElement).value })}
              />
            </label>
          </div>
        </section>

        <section>
          <h2>Detekcja numerów</h2>
          <label class="field">
            <span>Region domyślny (numery krajowe)</span>
            <select
              value={cfg.defaultRegion}
              onChange={(e) => update({ defaultRegion: (e.target as HTMLSelectElement).value as CountryCode })}
            >
              {REGIONS.map((r) => (
                <option value={r.code} key={r.code}>{r.label}</option>
              ))}
            </select>
          </label>

          <label class="field">
            <span>Tryb prezentacji</span>
            <select
              value={cfg.detectionMode}
              onChange={(e) => update({ detectionMode: (e.target as HTMLSelectElement).value as DetectionMode })}
            >
              <option value="subtle">Subtelny (podkreślenie + ikona na hover)</option>
              <option value="aggressive">Agresywny (wyraźne, klikalne numery)</option>
              <option value="off">Wyłączony</option>
            </select>
          </label>

          <label class="row">
            <input
              type="checkbox"
              checked={cfg.allowlistMode}
              onChange={(e) => update({ allowlistMode: (e.target as HTMLInputElement).checked })}
            />
            <span>Skanuj tylko wybrane domeny (allowlist)</span>
          </label>

          {cfg.allowlistMode ? (
            <label class="field">
              <span>Allowlist (po jednej domenie w linii)</span>
              <textarea
                rows={4}
                value={cfg.allowlist.join('\n')}
                onInput={(e) =>
                  update({
                    allowlist: (e.target as HTMLTextAreaElement).value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
          ) : (
            <button class="ghost" onClick={grantAllUrls}>
              Zezwól na autodetekcję na wszystkich stronach (&lt;all_urls&gt;)
            </button>
          )}
        </section>

        <section>
          <h2>Screen-pop (CRM)</h2>
          <label class="field">
            <span>Szablon URL otwierany przy połączeniu wychodzącym</span>
            <input
              type="text"
              placeholder="https://crm.twojafirma.pl/search?phone={number}"
              value={cfg.screenPopUrl}
              onInput={(e) => update({ screenPopUrl: (e.target as HTMLInputElement).value })}
            />
            <span class="hint">
              Placeholdery: <code>{'{number}'}</code> (E.164), <code>{'{national}'}</code>.
              Puste pole = wyłączone.
            </span>
          </label>
        </section>

        <div class="row between actions">
          <button class="primary" onClick={save}>Zapisz</button>
          {saved && <span class="ok">✓ Zapisano</span>}
        </div>

        <section>
          <h2>Kopia zapasowa / polityka</h2>
          <p class="hint">
            Eksport pomija sekret klienta. Wdrożenia enterprise mogą wymusić
            konfigurację przez politykę (chrome.storage.managed) — ma ona
            pierwszeństwo nad ustawieniami lokalnymi.
          </p>
          <div class="row" style="gap:12px">
            <button class="ghost" onClick={doExport}>Eksportuj konfigurację (JSON)</button>
            <label class="ghost" style="cursor:pointer">
              Importuj z pliku…
              <input type="file" accept="application/json" style="display:none" onChange={doImport} />
            </label>
            {importErr && <span class="err">Niepoprawny plik konfiguracji</span>}
          </div>
        </section>

        <Diagnostics />
      </main>
      <AppFooter />
    </div>
  );
}
