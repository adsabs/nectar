import { EVENT_REGISTRY } from './registry';

export const exportContract = (): typeof EVENT_REGISTRY => EVENT_REGISTRY;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (isPlainObject(value)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortKeysDeep(value[key]);
    }
    return sorted;
  }
  return value;
}

export const contractToJson = (): string => `${JSON.stringify(sortKeysDeep(exportContract()), null, 2)}\n`;
