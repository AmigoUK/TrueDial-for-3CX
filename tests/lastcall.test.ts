import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { saveLastCall, loadLastCall, type LastCallRecord } from '../lib/storage';

describe('last call record', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('is null before any call', async () => {
    expect(await loadLastCall()).toBeNull();
  });

  it('round-trips the per-strategy trail', async () => {
    const rec: LastCallRecord = {
      e164: '+442079460958',
      ts: 1,
      ok: true,
      strategy: 'deeplink',
      attempts: [
        { strategy: 'ccapi', ok: false, reason: 'makecall 401' },
        { strategy: 'deeplink', ok: true },
      ],
    };
    await saveLastCall(rec);
    expect(await loadLastCall()).toEqual(rec);
  });
});
