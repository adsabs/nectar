import { beforeEach, describe, expect, test, vi } from 'vitest';
import { transformUrl } from '@/components/FeedbackForms/MissingRecord/UrlUtil';

describe('resourceLinks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  test('transformUrl filters known static/resource files', () => {
    expect(transformUrl('https://example.com/image.jpg')).toBeNull();
    expect(transformUrl('https://example.com/script.js')).toBeNull();
  });

  test('transformUrl assigns correct type', () => {
    expect(transformUrl('https://arxiv.org/pdf/foo.pdf')).toEqual({
      type: 'arXiv',
      url: 'https://arxiv.org/pdf/foo.pdf',
    });

    expect(transformUrl('https://doi.org/10.1234')).toEqual({
      type: 'DOI',
      url: 'https://doi.org/10.1234',
    });

    expect(transformUrl('https://example.com/anything')).toEqual({
      type: 'HTML',
      url: 'https://example.com/anything',
    });
  });

  test('transformUrl returns null for empty or invalid URLs', () => {
    expect(transformUrl('')).toBeNull();
    expect(transformUrl('invalid-url')).toBeNull();
    expect(transformUrl('https://example.com/image.png')).toBeNull();
  });

  test('transformUrl normalizes URLs', () => {
    expect(transformUrl('https://example.com/')).toEqual({
      type: 'HTML',
      url: 'https://example.com',
    });
    expect(transformUrl('https://example.com/page.HTML')).toEqual({
      type: 'HTML',
      url: 'https://example.com/page.html',
    });
  });
});
