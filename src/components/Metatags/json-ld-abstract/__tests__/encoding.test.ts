import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodingTransform } from '@/components/Metatags/json-ld-abstract/encoding';

// minimal types (no `any`)
type TestSource = {
  url: string;
  open?: boolean;
  shortName?: string;
  name?: string;
  type?: string;
  description?: string;
  rawType?: string;
};
type ProcessLinkDataReturn = { fullTextSources: TestSource[] };

let mockSources: TestSource[] = [];

// mock processLinkData to feed our sources
vi.mock('@/components/AbstractSources/linkGenerator', () => ({
  processLinkData: (): ProcessLinkDataReturn => ({ fullTextSources: mockSources }),
}));

describe('buildEncodingsFromSources', () => {
  beforeEach(() => {
    mockSources = [];
  });

  it('maps PDF/HTML to MediaObject with absolutized URLs and MIME in encodingFormat', () => {
    mockSources = [
      { url: '/link_gateway/BIB/EPRINT_PDF', name: 'Preprint PDF', type: 'PDF', description: 'Preprint PDF' },
      { url: '/link_gateway/BIB/EPRINT_HTML', name: 'Preprint HTML', type: 'HTML', description: 'Preprint Article' },
    ];

    const enc = encodingTransform({}, 'https://scixplorer.org');

    expect(enc).toEqual([
      {
        '@type': 'MediaObject',
        contentUrl: 'https://scixplorer.org/link_gateway/BIB/EPRINT_PDF',
        name: 'Preprint PDF',
        description: 'Preprint PDF',
        encodingFormat: 'application/pdf',
      },
      {
        '@type': 'MediaObject',
        contentUrl: 'https://scixplorer.org/link_gateway/BIB/EPRINT_HTML',
        name: 'Preprint HTML',
        description: 'Preprint Article',
        encodingFormat: 'text/html',
      },
    ]);
  });

  it('falls back to shortName when name is missing', () => {
    mockSources = [{ url: '/link_gateway/BIB/EPRINT_PDF', shortName: 'Preprint', type: 'PDF' }];

    const enc = encodingTransform({}, 'https://scixplorer.org');

    expect(enc[0]).toMatchObject({
      '@type': 'MediaObject',
      contentUrl: 'https://scixplorer.org/link_gateway/BIB/EPRINT_PDF',
      name: 'Preprint',
      encodingFormat: 'application/pdf',
    });
  });

  it('absolutizes even odd-looking relative paths (no throw), and also handles a normal entry', () => {
    mockSources = [
      { url: '::not a url::', name: 'Bad', type: 'PDF' }, // becomes encoded path
      { url: '/ok', name: 'OK', type: 'HTML' },
    ];

    const enc = encodingTransform({}, 'https://scixplorer.org');

    expect(enc).toEqual([
      {
        '@type': 'MediaObject',
        contentUrl: 'https://scixplorer.org/::not%20a%20url::',
        name: 'Bad',
        description: undefined,
        encodingFormat: 'application/pdf',
      },
      {
        '@type': 'MediaObject',
        contentUrl: 'https://scixplorer.org/ok',
        name: 'OK',
        description: undefined,
        encodingFormat: 'text/html',
      },
    ]);
  });

  it('leaves encodingFormat undefined for unknown types', () => {
    mockSources = [{ url: '/foo', name: 'Foo', type: 'XML' }];

    const enc = encodingTransform({}, 'https://scixplorer.org');

    expect(enc[0]).toMatchObject({
      '@type': 'MediaObject',
      contentUrl: 'https://scixplorer.org/foo',
      name: 'Foo',
    });
    expect((enc[0] as { encodingFormat?: string }).encodingFormat).toBeUndefined();
  });

  it('returns empty array when there are no sources', () => {
    mockSources = [];

    const enc = encodingTransform({}, 'https://scixplorer.org');

    expect(enc).toEqual([]);
  });
});
