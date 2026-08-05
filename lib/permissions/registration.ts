// Least-privilege host access (§8, R3). The content script is registered at
// RUNTIME for exactly the origins the user has granted — it never appears in
// the manifest, so installing the extension shows no "read data on all
// websites" warning. The pure helpers here compute what to register/request;
// the background worker applies them via chrome.scripting.

/** The runtime-registered content script's stable identifier. */
export const CONTENT_SCRIPT_ID = 'truedial-detect';

/** Path of the built detection script inside the extension bundle (WXT emits
 *  entrypoints/content.ts there for both manifest and runtime registration). */
export const CONTENT_SCRIPT_JS = 'content-scripts/content.js';

/** Strips a port from a host[:port] — match patterns cannot carry ports, and a
 *  portless pattern matches the origin on ANY port. */
export function hostWithoutPort(host: string): string {
  return host.replace(/:\d+$/, '');
}

/** Origin pattern granting fetch access to the PBX (token + Call Control API +
 *  health checks). Ports are stripped: https://pbx.test/* also matches :5001. */
export function pbxOriginPattern(fqdn: string): string {
  return `https://${hostWithoutPort(fqdn)}/*`;
}

/** Origin patterns for detection on one allowlisted host (either scheme). */
export function allowlistOriginPattern(host: string): string {
  return `*://${hostWithoutPort(host)}/*`;
}

/** The match patterns the detection content script should be registered for,
 *  given the currently granted origin permissions. `<all_urls>` swallows
 *  everything else; otherwise each granted origin is registered as-is. */
export function contentScriptMatches(grantedOrigins: readonly string[]): string[] {
  if (grantedOrigins.includes('<all_urls>')) return ['<all_urls>'];
  return [...new Set(grantedOrigins)];
}
