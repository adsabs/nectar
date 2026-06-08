import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  startSpan: vi.fn((options, callback) => callback({ setStatus: vi.fn() })),
  startInactiveSpan: vi.fn(() => ({ end: vi.fn() })),
  setTag: vi.fn(),
}));

describe('performance utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackUserFlow', () => {
    test('should create a span with the correct name and call the callback', async () => {
      const { trackUserFlow } = await import('../performance');
      const mockFn = vi.fn().mockResolvedValue('result');

      const result = await trackUserFlow('search.submit.total', mockFn);

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'search.submit.total',
          op: 'user.flow',
        }),
        expect.any(Function),
      );
      expect(result).toBe('result');
    });

    test('should pass additional tags to the span', async () => {
      const { trackUserFlow } = await import('../performance');
      const mockFn = vi.fn().mockResolvedValue('result');

      await trackUserFlow('search.submit.total', mockFn, {
        query_type: 'simple',
        result_count_bucket: '11-100',
      });

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'search.submit.total',
          attributes: expect.objectContaining({
            query_type: 'simple',
            result_count_bucket: '11-100',
          }),
        }),
        expect.any(Function),
      );
    });

    test('should handle errors and still end the span', async () => {
      const { trackUserFlow } = await import('../performance');
      const error = new Error('Test error');
      const mockFn = vi.fn().mockRejectedValue(error);

      await expect(trackUserFlow('search.submit.total', mockFn)).rejects.toThrow('Test error');
    });
  });

  describe('startRenderSpan', () => {
    test('should start an inactive span and return end function', async () => {
      const { startRenderSpan } = await import('../performance');
      const mockEnd = vi.fn();
      vi.mocked(Sentry.startInactiveSpan).mockReturnValue({
        end: mockEnd,
      } as unknown as ReturnType<typeof Sentry.startInactiveSpan>);

      const { end } = startRenderSpan('search.results.render');

      expect(Sentry.startInactiveSpan).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'search.results.render',
          op: 'ui.render',
        }),
      );

      end();
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  describe('getResultCountBucket', () => {
    test('should return correct buckets', async () => {
      const { getResultCountBucket } = await import('../performance');

      expect(getResultCountBucket(0)).toBe('0');
      expect(getResultCountBucket(1)).toBe('1-10');
      expect(getResultCountBucket(10)).toBe('1-10');
      expect(getResultCountBucket(11)).toBe('11-100');
      expect(getResultCountBucket(100)).toBe('11-100');
      expect(getResultCountBucket(101)).toBe('100+');
      expect(getResultCountBucket(1000)).toBe('100+');
    });
  });

  describe('getQueryType', () => {
    test('should detect simple queries', async () => {
      const { getQueryType } = await import('../performance');

      expect(getQueryType('black holes')).toBe('simple');
      expect(getQueryType('exoplanet')).toBe('simple');
    });

    test('should detect fielded queries', async () => {
      const { getQueryType } = await import('../performance');

      expect(getQueryType('author:Einstein')).toBe('fielded');
      expect(getQueryType('title:relativity')).toBe('fielded');
      expect(getQueryType('bibcode:2020ApJ')).toBe('fielded');
    });

    test('should detect boolean queries', async () => {
      const { getQueryType } = await import('../performance');

      expect(getQueryType('black holes AND exoplanets')).toBe('boolean');
      expect(getQueryType('author:Einstein OR author:Bohr')).toBe('boolean');
      expect(getQueryType('NOT dark matter')).toBe('boolean');
    });
  });
});
