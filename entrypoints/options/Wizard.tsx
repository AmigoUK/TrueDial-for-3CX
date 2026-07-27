import { useState } from 'preact/hooks';
import type { CountryCode } from 'libphonenumber-js/min';
import type { Config } from '../../lib/storage';
import type { PreferredPath } from '../../lib/call/select';
import { buildDeepLinkUrl, normalizeFqdn } from '../../lib/call/deeplink';
import { STEPS, type Step, canAdvance, nextStep, prevStep } from '../../lib/onboarding/steps';
import { REGIONS } from './regions';

// Guided first-run setup (§10). Renders the pure step machine and writes into a
// working copy of the config; the parent persists it on completion.
export function Wizard({ initial, onDone }: { initial: Config; onDone: (cfg: Config) => void }) {
  const [step, setStep] = useState<Step>('fqdn');
  const [cfg, setCfg] = useState<Config>(initial);
  const update = (patch: Partial<Config>) => setCfg({ ...cfg, ...patch });

  const idx = STEPS.indexOf(step);
  const grantAllUrls = () => browser.permissions.request({ origins: ['<all_urls>'] });
  const testDeepLink = () => {
    if (cfg.fqdn) browser.tabs.create({ url: buildDeepLinkUrl(cfg.fqdn, '+000000000') });
  };

  return (
    <main class="card wizard">
      <div class="wizard-progress">Krok {idx + 1} z {STEPS.length}</div>

      {step === 'fqdn' && (
        <div>
          <h2>1 · Adres 3CX</h2>
          <label class="field">
            <span>FQDN instancji 3CX</span>
            <input
              type="text"
              placeholder="pbx.twojafirma.pl"
              value={cfg.fqdn ?? ''}
              onInput={(e) => update({ fqdn: (e.target as HTMLInputElement).value })}
            />
            <span class="hint">Np. adres, pod którym otwierasz web client 3CX.</span>
          </label>
        </div>
      )}

      {step === 'path' && (
        <div>
          <h2>2 · Sposób dzwonienia</h2>
          <label class="field">
            <span>Preferowana ścieżka</span>
            <select
              value={cfg.preferredPath}
              onChange={(e) => update({ preferredPath: (e.target as HTMLSelectElement).value as PreferredPath })}
            >
              <option value="auto">Automatycznie (zalecane)</option>
              <option value="ccapi">Tylko Call Control API</option>
              <option value="deeplink">Tylko deep-link web clienta</option>
              <option value="tel">Tylko tel:</option>
            </select>
          </label>
          <button class="ghost" disabled={!cfg.fqdn} onClick={testDeepLink}>Testuj deep-link</button>
        </div>
      )}

      {step === 'region' && (
        <div>
          <h2>3 · Region domyślny</h2>
          <label class="field">
            <span>Kraj dla numerów bez prefiksu</span>
            <select
              value={cfg.defaultRegion}
              onChange={(e) => update({ defaultRegion: (e.target as HTMLSelectElement).value as CountryCode })}
            >
              {REGIONS.map((r) => (
                <option value={r.code} key={r.code}>{r.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 'permissions' && (
        <div>
          <h2>4 · Autodetekcja</h2>
          <p class="hint">
            Aby wykrywać numery na stronach, zezwól na dostęp — albo ogranicz go do
            wybranych domen w ustawieniach później.
          </p>
          <button class="ghost" onClick={grantAllUrls}>
            Zezwól na wszystkich stronach (&lt;all_urls&gt;)
          </button>
        </div>
      )}

      {step === 'done' && (
        <div>
          <h2>Gotowe 🎉</h2>
          <p class="hint">
            3CX: <b>{cfg.fqdn ? normalizeFqdn(cfg.fqdn) : '—'}</b> · ścieżka:{' '}
            <b>{cfg.preferredPath}</b> · region: <b>{cfg.defaultRegion}</b>
          </p>
          <p class="hint">Możesz zmienić wszystko w ustawieniach w dowolnej chwili.</p>
        </div>
      )}

      <div class="row between actions">
        <button class="ghost" disabled={idx === 0} onClick={() => setStep(prevStep(step))}>Wstecz</button>
        {step === 'done' ? (
          <button class="primary" onClick={() => onDone(cfg)}>Zakończ</button>
        ) : (
          <button class="primary" disabled={!canAdvance(step, cfg)} onClick={() => setStep(nextStep(step))}>
            Dalej
          </button>
        )}
      </div>
    </main>
  );
}
