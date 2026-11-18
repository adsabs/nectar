import { sendGTMEvent } from '@next/third-parties/google';

import type { EventName, Exact, NoPayloadEventName, PayloadOf } from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripUndefinedValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefinedValue);
  }
  if (isPlainObject(value)) {
    return stripUndefinedRecord(value);
  }
  return value;
}

function stripUndefinedRecord(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) {
      continue;
    }
    result[key] = stripUndefinedValue(value);
  }
  return result;
}

export function track<E extends EventName, P extends PayloadOf<E>>(event: E, payload: Exact<P, PayloadOf<E>>): void;
export function track(event: NoPayloadEventName): void;
export function track(event: EventName, payload?: Record<string, unknown>): void {
  const body = payload === undefined ? {} : stripUndefinedRecord(payload);
  sendGTMEvent({ event, ...body });
}
