import { describe, expect, test } from 'vitest';
import { getAccessLabel, getGroupAccessLabel } from '../accessLabel';
import { Esources } from '@/api/search/types';

describe('getAccessLabel', () => {
  test('returns available label when open is true', () => {
    const result = getAccessLabel(true, Esources.EPRINT_PDF);
    expect(result).toEqual({
      badge: 'Available',
      colorScheme: 'green',
    });
  });

  test('returns login required label when open is false', () => {
    const result = getAccessLabel(false, Esources.PUB_HTML);
    expect(result).toEqual({
      badge: 'Login required',
      colorScheme: 'yellow',
    });
  });

  test('returns null for institution links', () => {
    const result = getAccessLabel(false, Esources.INSTITUTION);
    expect(result).toBeNull();
  });
});

describe('getGroupAccessLabel', () => {
  test('returns label from first non-institution link', () => {
    const links = [
      { open: true, rawType: Esources.EPRINT_PDF },
      { open: true, rawType: Esources.EPRINT_HTML },
    ];
    expect(getGroupAccessLabel(links)).toEqual({
      badge: 'Available',
      colorScheme: 'green',
    });
  });

  test('skips institution links', () => {
    const links = [
      { open: false, rawType: Esources.INSTITUTION },
      { open: false, rawType: Esources.PUB_PDF },
    ];
    expect(getGroupAccessLabel(links)).toEqual({
      badge: 'Login required',
      colorScheme: 'yellow',
    });
  });

  test('returns null for institution-only group', () => {
    const links = [{ open: false, rawType: Esources.INSTITUTION }];
    expect(getGroupAccessLabel(links)).toBeNull();
  });

  test('returns null for empty group', () => {
    expect(getGroupAccessLabel([])).toBeNull();
  });
});
