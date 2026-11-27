import { sendGTMEvent } from '@next/third-parties/google';

import { logger } from '@/logger';
import { EVENT_REGISTRY } from './registry';
import type { EventName, Exact, NoPayloadEventName, ParamDescriptor, PayloadOf } from './types';

type Descriptors = Readonly<Record<string, ParamDescriptor>>;

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

function resolveNestedValue(eventName: string, descriptor: ParamDescriptor, value: unknown): unknown {
  if (descriptor.type === 'object[]') {
    if (!Array.isArray(value)) {
      return stripUndefinedValue(value);
    }
    return value.map((item) =>
      isPlainObject(item) ? applyRegistryRules(eventName, descriptor.params ?? {}, item) : stripUndefinedValue(item),
    );
  }
  return isPlainObject(value)
    ? applyRegistryRules(eventName, descriptor.params ?? {}, value)
    : stripUndefinedValue(value);
}

function resolveLeafValue(
  eventName: string,
  paramName: string,
  descriptor: ParamDescriptor,
  value: unknown,
): { include: boolean; value: unknown } {
  if (value !== undefined) {
    return { include: true, value };
  }
  if (!descriptor.required) {
    return { include: false, value: undefined };
  }
  if (!descriptor.nullable) {
    logger.warn(
      { event: eventName, param: paramName },
      'track: required non-nullable parameter received undefined; clearing with null',
    );
  }
  return { include: true, value: null };
}

function applyRegistryRules(eventName: string, descriptors: Descriptors, payload: Record<string, unknown>) {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    const descriptor = descriptors[key];
    if (!descriptor) {
      if (value !== undefined) {
        result[key] = stripUndefinedValue(value);
      }
      continue;
    }

    if (descriptor.type === 'object' || descriptor.type === 'object[]') {
      if (value !== undefined) {
        result[key] = resolveNestedValue(eventName, descriptor, value);
      }
      continue;
    }

    const resolved = resolveLeafValue(eventName, key, descriptor, value);
    if (resolved.include) {
      result[key] = resolved.value;
    }
  }

  return result;
}

export function track<E extends EventName, P extends PayloadOf<E>>(event: E, payload: Exact<P, PayloadOf<E>>): void;
export function track(event: NoPayloadEventName): void;
export function track(event: EventName, payload?: Record<string, unknown>): void {
  const descriptors: Descriptors = EVENT_REGISTRY[event].params;
  const body = payload === undefined ? {} : applyRegistryRules(event, descriptors, payload);
  sendGTMEvent({ event, ...body });
}
