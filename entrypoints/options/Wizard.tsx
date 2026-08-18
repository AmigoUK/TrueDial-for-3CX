import { useState } from 'preact/hooks';
import type { CountryCode } from 'libphonenumber-js/min';
import type { Config } from '../../lib/storage';
import type { PreferredPath } from '../../lib/call/select';
import { buildDeepLinkUrl, normalizeFqdn } from '../../lib/call/deeplink';
import { pbxOriginPattern } from '../../lib/permissions/registration';
import { STEPS, type Step, canAdvance, nextStep, prevStep } from '../../lib/onboarding/steps';
import { t } from '../../lib/i18n';
import { REGIONS } from './regions';

// Guided first-run setup (§10). Renders the pure step machine and writes into a
// working copy of the config; the parent persists it on completion.
export function Wizard({ initial, onDone }: { initial: Config; onDone: (cfg: Config) => void }) {
  const [step, setStep] = useState<Step>('fqdn');
  const [cfg, setCfg] = useState<Config>(initial);
  const update = (patch: Partial<Config>) => setCfg({ ...cfg, ...patch });

  const idx = STEPS.indexOf(step);
  const grantAllUrls = () => browser.permissions.request({ origins: ['<all_urls>'] });
  const grantPbx = () => {
    if (cfg.fqdn) {
      void browser.permissions
        .request({ origins: [pbxOriginPattern(normalizeFqdn(cfg.fqdn))] })
        .catch(() => {});
    }
  };
  const testDeepLink = () => {
    if (cfg.fqdn) browser.tabs.create({ url: buildDeepLinkUrl(cfg.fqdn, '+000000000') });
  };

  return (
    <main class="card wizard">
      <div class="wizard-progress">
        <span>
          {t('wiz_step')} {idx + 1} {t('wiz_of')} {STEPS.length}
        </span>
        <span class="wizard-bar" aria-hidden="true">
          {STEPS.map((s, i) => (
            <i key={s} class={i <= idx ? 'on' : ''} />
          ))}
        </span>
      </div>

      {step === 'fqdn' && (
        <div class="wizard-step">
          <h2>{t('wiz_s1_title')}</h2>
          <label class="field">
            <span>{t('opt_fqdnLabel')}</span>
            <input
              type="text"
              placeholder="pbx.example.co.uk"
              value={cfg.fqdn ?? ''}
              onInput={(e) => update({ fqdn: (e.target as HTMLInputElement).value })}
            />
            <span class="hint">{t('wiz_s1_hint')}</span>
          </label>
        </div>
      )}

      {step === 'path' && (
        <div class="wizard-step">
          <h2>{t('wiz_s2_title')}</h2>
          <label class="field">
            <span>{t('opt_pathLabel')}</span>
            <select
              value={cfg.preferredPath}
              onChange={(e) =>
                update({ preferredPath: (e.target as HTMLSelectElement).value as PreferredPath })
              }
            >
              <option value="auto">{t('wiz_path_auto')}</option>
              <option value="ccapi">{t('opt_path_ccapi')}</option>
              <option value="deeplink">{t('opt_path_deeplink')}</option>
              <option value="tel">{t('opt_path_tel')}</option>
            </select>
          </label>
          <button class="ghost" disabled={!cfg.fqdn} onClick={testDeepLink}>
            {t('opt_testDeepLink')}
          </button>
        </div>
      )}

      {step === 'region' && (
        <div class="wizard-step">
          <h2>{t('wiz_s3_title')}</h2>
          <label class="field">
            <span>{t('wiz_s3_label')}</span>
            <select
              value={cfg.defaultRegion}
              onChange={(e) =>
                update({ defaultRegion: (e.target as HTMLSelectElement).value as CountryCode })
              }
            >
              {REGIONS.map((r) => (
                <option value={r.code} key={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 'permissions' && (
        <div class="wizard-step">
          <h2>{t('wiz_s4_title')}</h2>
          <p class="hint">{t('wiz_s4_hint')}</p>
          <div class="row" style="gap:12px">
            <button class="ghost" disabled={!cfg.fqdn} onClick={grantPbx}>
              {t('wiz_grantPbx')}
            </button>
            <button class="ghost" onClick={grantAllUrls}>
              {t('wiz_grantAll')}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div class="wizard-step">
          <h2>{t('wiz_done_title')}</h2>
          <p class="hint">
            3CX: <b>{cfg.fqdn ? normalizeFqdn(cfg.fqdn) : '—'}</b> · {t('wiz_sum_path')}:{' '}
            <b>{cfg.preferredPath}</b> · {t('wiz_sum_region')}: <b>{cfg.defaultRegion}</b>
          </p>
          <p class="hint">{t('wiz_done_hint')}</p>
        </div>
      )}

      <div class="row between actions">
        <button class="ghost" disabled={idx === 0} onClick={() => setStep(prevStep(step))}>
          {t('wiz_back')}
        </button>
        {step === 'done' ? (
          <button class="primary" onClick={() => onDone(cfg)}>
            {t('wiz_finish')}
          </button>
        ) : (
          <button
            class="primary"
            disabled={!canAdvance(step, cfg)}
            onClick={() => setStep(nextStep(step))}
          >
            {t('wiz_next')}
          </button>
        )}
      </div>
    </main>
  );
}
