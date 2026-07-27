// Typed messaging między content scriptem / popupem / options a service workerem.
// Content script jest traktowany jako KANAŁ NIEZAUFANY (strona może próbować
// spoofować wiadomości), więc każdy komunikat waliduje się schematem zod PRZED
// użyciem, a w SW dodatkowo sprawdzamy `sender.id` (patrz background.ts).

import { z } from 'zod';

// E.164: '+' i 1–15 cyfr, pierwsza cyfra 1–9.
const e164 = z.string().regex(/^\+[1-9]\d{6,14}$/, 'not E.164');

export const messageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PLACE_CALL'), e164, source: z.string().url().optional() }),
  z.object({ type: z.literal('GET_CONFIG') }),
  z.object({ type: z.literal('SET_SITE_ENABLED'), host: z.string().min(1), enabled: z.boolean() }),
  z.object({ type: z.literal('GET_SITE_ENABLED'), host: z.string().min(1) }),
]);

export type Message = z.infer<typeof messageSchema>;

/** Zwraca zwalidowaną wiadomość albo `null` (nigdy nie rzuca). */
export function parseMessage(input: unknown): Message | null {
  const res = messageSchema.safeParse(input);
  return res.success ? res.data : null;
}
