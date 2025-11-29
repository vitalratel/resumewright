/**
 * Message Validation Functions
 *
 * Runtime validation functions using Valibot schemas.
 * Runtime validation for messages
 */

import type { AnyMessage, Message } from '@/shared/types/messages';
import { MessageSchema } from '../schemas/messages';

import { safeParse } from '../valibot';

/**
 * Validate Message
 */
export function validateMessage(data: unknown): data is Message<unknown> {
  return safeParse(MessageSchema, data).success;
}

export function parseMessage(
  data: unknown
): { success: true; data: AnyMessage } | { success: false; error: string } {
  const result = safeParse(MessageSchema, data);

  if (result.success) {
    return { success: true, data: result.output as AnyMessage };
  }

  return {
    success: false,
    error: result.issues
      .map((e) => `${e.path?.map((p) => String(p.key)).join('.') ?? 'root'}:${e.message}`)
      .join(', '),
  };
}
