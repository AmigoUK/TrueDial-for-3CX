import { useEffect, useState } from 'preact/hooks';
import type { CountryCode } from 'libphonenumber-js/min';
import { getConfig, setConfig, type Config, type DetectionMode } from '../../lib/storage';
import { normalizeFqdn, buildDeepLinkUrl } from '../../lib/call/deeplink';
import { AppFooter } from '../../components/AppFooter';

// Curated lista regionów (picker, nie wolny tekst) — najczęstsze rynki 3CX SMB.
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

        <div class="row between actions">
          <button class="primary" onClick={save}>Zapisz</button>
          {saved && <span class="ok">✓ Zapisano</span>}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
