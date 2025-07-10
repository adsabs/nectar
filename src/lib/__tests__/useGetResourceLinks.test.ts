import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchUrl, transformUrl } from '../useGetResourceLinks';

const htmlWithLinks = `
  <script src="my-script.js" defer=""></script>
  <script src="my-styles.css" defer=""></script>
  <a href="https://arxiv.org/pdf/1234.5678.pdf">arXiv</a>
  <a href="https://doi.org/10.1234/abcd">DOI</a>
  <a href="https://example.com/page.html">HTML</a>
  <a href="https://example.com/style.css">CSS</a>
  <a href="http://www.nasa.gov">NASA</a>
  <a href="https://example.com/document.pdf">PDF</a>
  <a href="https://example.com/page.html">HTML Duplicate</a>
`;

const SKIP_URLS = [
  'http://www.cfa.harvard.edu/sao',
  'https://www.cfa.harvard.edu/',
  'http://www.si.edu',
  'http://www.nasa.gov',
];

const expectedUrls = [
  { type: 'arXiv', url: 'https://arxiv.org/pdf/1234.5678.pdf' },
  { type: 'DOI', url: 'https://doi.org/10.1234/abcd' },
  { type: 'HTML', url: 'https://example.com/page.html' },
  { type: 'PDF', url: 'https://example.com/document.pdf' },
];

describe('resourceLinks', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  test('transformUrl filters known static/resource files', () => {
    expect(transformUrl('https://example.com/image.jpg')).toBeNull();
    expect(transformUrl('https://example.com/script.js')).toBeNull();
  });

  test('transformUrl filters known skipped domains', () => {
    for (const url of SKIP_URLS) {
      expect(transformUrl(url)).toBeNull();
    }
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

  test('fetchUrl returns deduplicated transformed links', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      text: () => Promise.resolve(htmlWithLinks),
    });

    const result = await fetchUrl('fake-id');
    expect(result).toEqual(expectedUrls);
  });

  test('fetchUrl returns empty list if input has no valid links', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      text: () => Promise.resolve('<p>No links here</p>'),
    });

    const result = await fetchUrl('fake-id');
    expect(result).toEqual([]);
  });
});
