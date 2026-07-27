import { describe, it, expect } from 'vitest';
import en from '../public/_locales/en/messages.json';
import pl from '../public/_locales/pl/messages.json';
import de from '../public/_locales/de/messages.json';
import fr from '../public/_locales/fr/messages.json';
import es from '../public/_locales/es/messages.json';

const enKeys = new Set(Object.keys(en));
const locales = { pl, de, fr, es } as const;

describe('i18n catalogues', () => {
  it('the default locale (en) is non-empty', () => {
    expect(enKeys.size).toBeGreaterThan(50);
  });

  it('every locale key exists in the default locale (no orphans)', () => {
    for (const [name, cat] of Object.entries(locales)) {
      const orphans = Object.keys(cat).filter((k) => !enKeys.has(k));
      expect(orphans, `orphan keys in ${name}`).toEqual([]);
    }
  });

  it('translated locales are complete (cover every en key)', () => {
    for (const [name, cat] of Object.entries(locales)) {
      const missing = [...enKeys].filter((k) => !(k in cat));
      expect(missing, `missing keys in ${name}`).toEqual([]);
    }
  });

  it('no message is an empty string', () => {
    for (const [name, cat] of Object.entries({ en, ...locales })) {
      for (const [k, v] of Object.entries(cat as Record<string, { message: string }>)) {
        expect(v.message.length, `${name}.${k}`).toBeGreaterThan(0);
      }
    }
  });
});
