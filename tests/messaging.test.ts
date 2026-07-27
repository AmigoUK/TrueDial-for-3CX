import { describe, it, expect } from 'vitest';
import { parseMessage, type Message } from '../lib/messaging/schema';

describe('parseMessage', () => {
  it('akceptuje poprawny PLACE_CALL', () => {
    const msg: Message = { type: 'PLACE_CALL', e164: '+48221234567', source: 'https://x.pl' };
    expect(parseMessage(msg)).toEqual(msg);
  });

  it('akceptuje GET_CONFIG bez pól', () => {
    expect(parseMessage({ type: 'GET_CONFIG' })).toEqual({ type: 'GET_CONFIG' });
  });

  it('akceptuje SET_SITE_ENABLED', () => {
    const msg: Message = { type: 'SET_SITE_ENABLED', host: 'app.example.com', enabled: false };
    expect(parseMessage(msg)).toEqual(msg);
  });

  it('odrzuca nieznany typ', () => {
    expect(parseMessage({ type: 'DROP_TABLES' })).toBeNull();
  });

  it('odrzuca PLACE_CALL bez e164', () => {
    expect(parseMessage({ type: 'PLACE_CALL' })).toBeNull();
  });

  it('odrzuca e164 nie-E.164 (spoofing ze strony)', () => {
    expect(parseMessage({ type: 'PLACE_CALL', e164: '221234567' })).toBeNull();
  });

  it('odrzuca całkowicie niepoprawny input', () => {
    expect(parseMessage(null)).toBeNull();
    expect(parseMessage('PLACE_CALL')).toBeNull();
    expect(parseMessage(42)).toBeNull();
  });
});
