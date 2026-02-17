import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchUrl, transformUrl } from '../useGetResourceLinks';

const htmlWithLinks = `
<body>
  <div class="header-container">
    <header class="starry-background-wrapper">
      <div class="logo-header">
        <a href="/">
          <img src="/styles/img/scix-logo.svg" alt="Science Explorer Logo">
          <b>Science Explorer</b>
        </a>
      </div>
    </header>
  </div>
  <div class="main-container container-sm">
    <h3 class="text-center">links for <a href="/abs/2023ApJ/abstract"><b>2023ApJ</b></a></h3>
    <div class="list-group">
      <div class="list-group-item">
        <a href="https://arxiv.org/abs/2310.03851" class="title">https://arxiv.org/abs/2310.03851</a>
      </div>
      <div class="list-group-item">
        <a href="https://arxiv.org/pdf/2310.03851" class="title">https://arxiv.org/pdf/2310.03851</a>
      </div>
      <div class="list-group-item">
        <a href="https://doi.org/10.3847/1538-4357/acffbd" class="title">https://doi.org/10.3847/1538-4357/acffbd</a>
      </div>
      <div class="list-group-item">
        <a href="https://example.com/document.pdf" class="title">https://example.com/document.pdf</a>
      </div>
    </div>
  </div>
  <div class="footer-container">
    <footer>
      <a href="http://www.si.edu" target="_blank">Smithsonian</a>
      <a href="https://www.cfa.harvard.edu/" target="_blank">CfA</a>
      <a href="http://www.nasa.gov" target="_blank">NASA</a>
      <a href="https://scixplorer.org/scixabout">About SciX</a>
      <a href="https://scixplorer.org/feedback/general">Give Feedback</a>
      <a href="https://twitter.com/scixcommunity">@scixcommunity</a>
    </footer>
  </div>
</body>
`;

const expectedUrls = [
  { type: 'arXiv', url: 'https://arxiv.org/abs/2310.03851' },
  { type: 'arXiv', url: 'https://arxiv.org/pdf/2310.03851' },
  { type: 'DOI', url: 'https://doi.org/10.3847/1538-4357/acffbd' },
  { type: 'PDF', url: 'https://example.com/document.pdf' },
];

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

  test('fetchUrl returns deduplicated transformed links', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      redirected: false,
      text: () => Promise.resolve(htmlWithLinks),
    });

    const result = await fetchUrl('fake-id');
    expect(result).toEqual(expectedUrls);
  });

  test('fetchUrl returns empty list if input has no valid links', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      redirected: false,
      text: () => Promise.resolve('<div class="list-group"></div>'),
    });

    const result = await fetchUrl('fake-id');
    expect(result).toEqual([]);
  });
});

describe('Redirected response', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  test('fetchUrl detects browser-followed redirect via res.redirected', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      redirected: true,
      url: 'https://doi.org/10.1234/foo',
      text: () => Promise.resolve(''),
    });

    const result = await fetchUrl('test-id');

    expect(result).toEqual([
      {
        type: 'DOI',
        url: 'https://doi.org/10.1234/foo',
      },
    ]);
  });

  test('fetchUrl returns empty if redirected URL is not valid', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      redirected: true,
      url: '',
      text: () => Promise.resolve(''),
    });

    const result = await fetchUrl('test-id');
    expect(result).toEqual([]);
  });
});

describe('Error responses', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  test('fetchUrl returns empty list on 404', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () =>
        Promise.resolve(
          '<h3>The requested resource does not exist</h3>' +
            '<footer><a href="https://scixplorer.org/scixabout">About</a></footer>',
        ),
    });

    const result = await fetchUrl('bad-bibcode');
    expect(result).toEqual([]);
  });

  test('fetchUrl returns empty list on 500', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    const result = await fetchUrl('error-bibcode');
    expect(result).toEqual([]);
  });
});
