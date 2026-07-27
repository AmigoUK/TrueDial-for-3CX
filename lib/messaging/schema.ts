// Typed messaging between the content script / popup / options and the service
// worker. The content script is treated as an UNTRUSTED channel (the page may
// try to spoof messages), so every message is validated against a zod schema
// BEFORE use, and the SW additionally checks `sender.id` (see background.ts).

import { z } from 'zod';

// E.164: '+' followed by 1–15 digits, first digit 1–9.
const e164 = z.string().regex(/^\+[1-9]\d{6,14}$/, 'not E.164');

export const messageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PLACE_CALL'), e164, source: z.string().url().optional() }),
  z.object({ type: z.literal('GET_CONFIG') }),
  z.object({ type: z.literal('SET_SITE_ENABLED'), host: z.string().min(1), enabled: z.boolean() }),
  z.object({ type: z.literal('GET_SITE_ENABLED'), host: z.string().min(1) }),
  z.object({ type: z.literal('HEALTH_CHECK') }),
]);

export type Message = z.infer<typeof messageSchema>;

/** Returns the validated message, or `null` (never throws). */
export function parseMessage(input: unknown): Message | null {
  const res = messageSchema.safeParse(input);
  return res.success ? res.data : null;
}
