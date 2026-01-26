import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGetAuthors } from '../useGetAuthors';
import { IDocsEntity } from '@/api/search/types';

describe('useGetAuthors', () => {
  it('filters out empty string orcid values from result', () => {
    const doc = {
      author: ['Smith, John', 'Doe, Jane'],
      aff: ['University A', 'University B'],
      orcid_other: undefined,
      orcid_pub: ['-', '-'],
      orcid_user: undefined,
    } as unknown as IDocsEntity;

    const { result } = renderHook(() => useGetAuthors({ doc }));

    // Each row should be [position, author, aff] with NO orcid values
    // since all orcids are either '-' or undefined (filled with '')
    expect(result.current).toEqual([
      ['1', 'Smith, John', 'University A'],
      ['2', 'Doe, Jane', 'University B'],
    ]);
  });

  it('preserves valid orcid values while filtering empty ones', () => {
    const doc = {
      author: ['Smith, John', 'Doe, Jane'],
      aff: ['University A', 'University B'],
      orcid_other: undefined,
      orcid_pub: ['0000-0001-2345-6789', '-'],
      orcid_user: undefined,
    } as unknown as IDocsEntity;

    const { result } = renderHook(() => useGetAuthors({ doc }));

    // First author has valid orcid, second has none
    expect(result.current).toEqual([
      ['1', 'Smith, John', 'University A', '0000-0001-2345-6789'],
      ['2', 'Doe, Jane', 'University B'],
    ]);
  });
});
