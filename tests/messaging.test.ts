import { describe, it, expect } from 'vitest';
import { parseMessage, type Message } from '../lib/messaging/schema';

describe('parseMessage', () => {
  it('accepts a valid PLACE_CALL', () => {
    const msg: Message = { type: 'PLACE_CALL', e164: '+48221234567', source: 'https://x.pl' };
    expect(parseMessage(msg)).toEqual(msg);
  });

  it('accepts GET_CONFIG with no fields', () => {
    expect(parseMessage({ type: 'GET_CONFIG' })).toEqual({ type: 'GET_CONFIG' });
  });

  it('accepts SET_SITE_ENABLED', () => {
    const msg: Message = { type: 'SET_SITE_ENABLED', host: 'app.example.com', enabled: false };
    expect(parseMessage(msg)).toEqual(msg);
  });

  it('rejects an unknown type', () => {
    expect(parseMessage({ type: 'DROP_TABLES' })).toBeNull();
  });

  it('rejects PLACE_CALL without e164', () => {
    expect(parseMessage({ type: 'PLACE_CALL' })).toBeNull();
  });

  it('rejects a non-E.164 e164 (page spoofing)', () => {
    expect(parseMessage({ type: 'PLACE_CALL', e164: '221234567' })).toBeNull();
  });

  it('rejects entirely invalid input', () => {
    expect(parseMessage(null)).toBeNull();
    expect(parseMessage('PLACE_CALL')).toBeNull();
    expect(parseMessage(42)).toBeNull();
  });

  it('accepts TEST_SOUND with and without inline tone parameters', () => {
    expect(parseMessage({ type: 'TEST_SOUND' })).toEqual({ type: 'TEST_SOUND' });
    const msg: Message = { type: 'TEST_SOUND', soundName: 'beep', volume: 0.4 };
    expect(parseMessage(msg)).toEqual(msg);
  });

  it('rejects TEST_SOUND with an out-of-range volume', () => {
    expect(parseMessage({ type: 'TEST_SOUND', volume: 1.5 })).toBeNull();
    expect(parseMessage({ type: 'TEST_SOUND', volume: -0.1 })).toBeNull();
  });
});
