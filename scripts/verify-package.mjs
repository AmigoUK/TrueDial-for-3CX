// Pre-submission checks on the built extension: cheap guards against the
// mistakes that cost a Chrome Web Store review round. Run after `wxt build`
// (and ideally after `wxt zip`): node scripts/verify-package.mjs
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '.output/chrome-mv3');

const EXPECTED_PERMISSIONS = ['storage', 'contextMenus', 'tabs', 'offscreen', 'scripting'];
const EXPECTED_OPTIONAL_HOSTS = ['<all_urls>'];
const EXPECTED_LOCALES = ['en', 'pl', 'de', 'fr', 'es'];
const ICON_SIZES = [16, 32, 48, 128];

const notes = [];
const problems = [];
const check = (ok, message) => (ok ? notes : problems).push(`${ok ? '✓' : '✗'} ${message}`);

if (!existsSync(out)) {
  console.error(`✗ no build at ${out} — run \`pnpm build\` first`);
  process.exit(1);
}

const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'));

check(manifest.manifest_version === 3, 'manifest V3');

// A manifest version must be purely numeric, so WXT silently drops any
// pre-release suffix. That is a trap worth naming: the store only ever sees the
// base number, so shipping 1.0.0-rc.1 burns 1.0.0 — the final 1.0.0 build is
// then rejected as an already-published version.
const [base, prerelease] = pkg.version.split('-');
check(
  manifest.version === base,
  `manifest version ${manifest.version} matches package.json ${pkg.version}`,
);
check(/^\d+(\.\d+){0,3}$/.test(manifest.version), `version ${manifest.version} is purely numeric`);
if (prerelease) {
  notes.push(
    `! package.json is ${pkg.version}, but the store will see ${base}: the ` +
      `pre-release suffix does not survive the manifest. Uploading this burns ` +
      `${base}, so bump the version before submitting the final ${base}.`,
  );
}
check(manifest.default_locale === 'en', 'default locale is en');

// A PNG's dimensions sit at a fixed offset inside the IHDR chunk.
for (const size of ICON_SIZES) {
  const rel = manifest.icons?.[String(size)];
  if (!rel) {
    problems.push(`✗ manifest declares no ${size}px icon`);
    continue;
  }
  if (!existsSync(join(out, rel))) {
    problems.push(`✗ icon missing on disk: ${rel}`);
    continue;
  }
  const buf = await readFile(join(out, rel));
  const [width, height] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  check(
    width === size && height === size,
    `icon ${rel} is ${size}x${size} (found ${width}x${height})`,
  );
}

const unexpected = (manifest.permissions ?? []).filter((p) => !EXPECTED_PERMISSIONS.includes(p));
check(
  unexpected.length === 0,
  `no unexpected permissions${unexpected.length ? `: ${unexpected}` : ''}`,
);

// Least privilege is the whole point of the runtime-registered content script:
// a hoisted host_permissions entry or a static content script would reinstate
// the install-time "read your data on all websites" warning.
check(!manifest.host_permissions?.length, 'no required host permissions');
check(!manifest.content_scripts?.length, 'no statically declared content scripts');
check(
  JSON.stringify(manifest.optional_host_permissions ?? []) ===
    JSON.stringify(EXPECTED_OPTIONAL_HOSTS),
  'optional host permissions are <all_urls>',
);

for (const loc of EXPECTED_LOCALES) {
  check(existsSync(join(out, '_locales', loc, 'messages.json')), `locale bundled: ${loc}`);
}

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return nested.flat();
};
const files = await walk(out);
check(!files.some((f) => extname(f) === '.map'), 'no source maps in the package');

const zips = (await readdir(join(root, '.output'))).filter(
  (f) => f.endsWith('.zip') && f.includes(pkg.version),
);
if (zips.length === 0) {
  notes.push(`… no ZIP for ${pkg.version} yet — run \`pnpm zip\``);
} else {
  for (const z of zips) {
    const { size } = await stat(join(root, '.output', z));
    check(size / 1024 / 1024 < 100, `${z} is ${(size / 1024 / 1024).toFixed(2)} MB`);
  }
}

console.log(notes.join('\n'));
if (problems.length) {
  console.error(`\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`\nPackage looks submission-ready (v${pkg.version}).`);
