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
import { TONE_NAMES } from '../../lib/audio/tone';
import type { Message } from '../../lib/messaging/schema';
import { isConfigured } from '../../lib/onboarding/steps';
import { t } from '../../lib/i18n';
import { REGIONS, suggestRegion } from './regions';
import { Wizard } from './Wizard';
import { Diagnostics } from './Diagnostics';
import { AppFooter } from '../../components/AppFooter';

export function App() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [saved, setSaved] = useState(false);
  const [importErr, setImportErr] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    void (async () => {
      const c = await getConfig();
      if (!c.fqdn && !c.defaultRegion) c.defaultRegion = suggestRegion();
      setCfg(c);
      setShowWizard(!isConfigured(c));
    })();
  }, []);

  if (!cfg) return <div class="pad">{t('common_loading')}</div>;

  if (showWizard) {
    return (
      <div class="shell">
        <Wizard
          initial={cfg}
          onDone={async (final) => {
            setCfg(await setConfig(final));
            setShowWizard(false);
          }}
        />
        <AppFooter />
      </div>
    );
  }

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
        <p class="muted">{t('opt_tagline')}</p>
        <button class="ghost" onClick={() => setShowWizard(true)}>{t('opt_wizardBtn')}</button>

        <section>
          <h2>{t('opt_sec_connection')}</h2>
          <label class="field">
            <span>{t('opt_fqdnLabel')}</span>
            <input
              type="text"
              placeholder="pbx.twojafirma.pl : 5001"
              value={cfg.fqdn ?? ''}
              onInput={(e) => update({ fqdn: (e.target as HTMLInputElement).value })}
            />
            <span class="hint">{t('opt_fqdnHint')}</span>
          </label>
          <button class="ghost" disabled={!cfg.fqdn} onClick={testDeepLink}>
            {t('opt_testDeepLink')}
          </button>

          <label class="field">
            <span>{t('opt_pathLabel')}</span>
            <select
              value={cfg.preferredPath}
              onChange={(e) => update({ preferredPath: (e.target as HTMLSelectElement).value as PreferredPath })}
            >
              <option value="auto">{t('opt_path_auto')}</option>
              <option value="ccapi">{t('opt_path_ccapi')}</option>
              <option value="deeplink">{t('opt_path_deeplink')}</option>
              <option value="tel">{t('opt_path_tel')}</option>
            </select>
            <span class="hint">{t('opt_pathHint')}</span>
          </label>
        </section>

        <section>
          <h2>{t('opt_sec_ccapi')}</h2>
          <p class="hint">{t('opt_ccapiHint')}</p>
          <label class="field">
            <span>{t('opt_clientId')}</span>
            <input
              type="text"
              value={cfg.clientId ?? ''}
              onInput={(e) => update({ clientId: (e.target as HTMLInputElement).value })}
            />
          </label>
          <label class="field">
            <span>{t('opt_clientSecret')}</span>
            <input
              type="password"
              autocomplete="off"
              value={cfg.clientSecret ?? ''}
              onInput={(e) => update({ clientSecret: (e.target as HTMLInputElement).value })}
            />
          </label>
          <div class="row" style="gap:12px">
            <label class="field" style="flex:1">
              <span>{t('opt_extension')}</span>
              <input
                type="text"
                placeholder="100"
                value={cfg.ccExtension ?? ''}
                onInput={(e) => update({ ccExtension: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="field" style="flex:1">
              <span>{t('opt_deviceId')}</span>
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
          <h2>{t('opt_sec_detection')}</h2>
          <label class="field">
            <span>{t('opt_regionLabel')}</span>
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
            <span>{t('opt_modeLabel')}</span>
            <select
              value={cfg.detectionMode}
              onChange={(e) => update({ detectionMode: (e.target as HTMLSelectElement).value as DetectionMode })}
            >
              <option value="subtle">{t('opt_mode_subtle')}</option>
              <option value="aggressive">{t('opt_mode_aggressive')}</option>
              <option value="off">{t('opt_mode_off')}</option>
            </select>
          </label>

          <label class="row">
            <input
              type="checkbox"
              checked={cfg.allowlistMode}
              onChange={(e) => update({ allowlistMode: (e.target as HTMLInputElement).checked })}
            />
            <span>{t('opt_allowlistToggle')}</span>
          </label>

          {cfg.allowlistMode ? (
            <label class="field">
              <span>{t('opt_allowlistLabel')}</span>
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
            <button class="ghost" onClick={grantAllUrls}>{t('opt_grantAll')}</button>
          )}
        </section>

        <section>
          <h2>{t('opt_sec_sound')}</h2>
          <label class="row">
            <input
              type="checkbox"
              checked={cfg.soundEnabled}
              onChange={(e) => update({ soundEnabled: (e.target as HTMLInputElement).checked })}
            />
            <span>{t('opt_soundEnable')}</span>
          </label>
          <div class="row" style="gap:12px;margin-top:10px">
            <label class="field" style="flex:1">
              <span>{t('opt_tone')}</span>
              <select
                value={cfg.soundName}
                onChange={(e) => update({ soundName: (e.target as HTMLSelectElement).value })}
              >
                {TONE_NAMES.map((n) => (
                  <option value={n} key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label class="field" style="flex:2">
              <span>{t('opt_volume')}: {Math.round(cfg.soundVolume * 100)}%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={cfg.soundVolume}
                onInput={(e) => update({ soundVolume: Number((e.target as HTMLInputElement).value) })}
              />
            </label>
          </div>
          <button
            class="ghost"
            style="margin-top:6px"
            onClick={async () => {
              await setConfig(cfg); // persist so the SW reads current settings
              const msg: Message = { type: 'TEST_SOUND' };
              await browser.runtime.sendMessage(msg);
            }}
          >
            {t('opt_testSound')}
          </button>
        </section>

        <section>
          <h2>{t('opt_sec_screenpop')}</h2>
          <label class="field">
            <span>{t('opt_screenpopLabel')}</span>
            <input
              type="text"
              placeholder="https://crm.twojafirma.pl/search?phone={number}"
              value={cfg.screenPopUrl}
              onInput={(e) => update({ screenPopUrl: (e.target as HTMLInputElement).value })}
            />
            <span class="hint">{t('opt_screenpopHint')}</span>
          </label>
        </section>

        <div class="row between actions">
          <button class="primary" onClick={save}>{t('opt_save')}</button>
          {saved && <span class="ok">{t('opt_saved')}</span>}
        </div>

        <section>
          <h2>{t('opt_sec_backup')}</h2>
          <p class="hint">{t('opt_backupHint')}</p>
          <div class="row" style="gap:12px">
            <button class="ghost" onClick={doExport}>{t('opt_export')}</button>
            <label class="ghost" style="cursor:pointer">
              {t('opt_import')}
              <input type="file" accept="application/json" style="display:none" onChange={doImport} />
            </label>
            {importErr && <span class="err">{t('opt_importErr')}</span>}
          </div>
        </section>

        <Diagnostics />
      </main>
      <AppFooter />
    </div>
  );
}
