import { describe, expect, it } from 'vitest';
import { volumeTransform } from '../volumes';

describe('volumeTransform', () => {
  it('returns undefined when pub is empty', () => {
    expect(volumeTransform({})).toBeUndefined();
    expect(volumeTransform({ pub: '   ' } as unknown as Partial<{ pub: string }>)).toBeUndefined();
  });

  it('returns Periodical when volume is not found', () => {
    const v = volumeTransform({ pub: 'Journal of Tests', pub_raw: 'id.A1' } as unknown as Partial<{
      pub: string;
      pub_raw: string;
    }>);
    expect(v).toEqual({ '@type': 'Periodical', name: 'Journal of Tests' });
  });

  it('returns PublicationVolume with volumeNumber and pagination when present', () => {
    const v = volumeTransform({ pub: 'Astro Letters', pub_raw: 'Volume 42 id.A6' } as unknown as Partial<{
      pub: string;
      pub_raw: string;
    }>);
    expect(v).toEqual({
      '@type': 'PublicationVolume',
      volumeNumber: '42',
      pagination: 'A6',
      isPartOf: { '@type': 'Periodical', name: 'Astro Letters' },
    });
  });

  it('handles pub_raw that lacks id code', () => {
    const v = volumeTransform({ pub: 'Space Journal', pub_raw: 'Volume 7' } as unknown as Partial<{
      pub: string;
      pub_raw: string;
    }>);
    expect(v).toEqual({
      '@type': 'PublicationVolume',
      volumeNumber: '7',
      isPartOf: { '@type': 'Periodical', name: 'Space Journal' },
    });
  });
});
