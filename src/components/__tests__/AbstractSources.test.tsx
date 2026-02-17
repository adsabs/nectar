import { render, waitFor } from '@/test-utils';
import { test, vi, expect, describe, beforeEach } from 'vitest';
import { AbstractSources } from '@/components/AbstractSources';
import { IDocsEntity } from '@/api/search/types';
import { server } from '@/mocks/server';
import { rest } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';

vi.mock('next/router', () => ({
  useRouter: () => ({
    reload: vi.fn(),
  }),
}));

const baseDoc = {
  bibcode: '2004AdM....16.2049S',
  author: ['Star, A.', 'Han, T. -R.', 'Joshi, V.', 'Gabriel, J. -C. P.', 'Grüner, G.'],
  author_count: 5,
  bibstem: ['AdM', 'AdM....16'],
  doi: ['10.1002/adma.200400322'],
  id: '21843905',
  identifier: ['2004AdM....16.2049S', '10.1002/adma.200400322'],
  orcid_pub: ['-', '-', '-', '-', '-'],
  pub: 'Advanced Materials',
  pub_raw: 'Advanced Materials, vol. 16, issue 22, pp. 2049-2052',
  pubdate: '2004-11-00',
  title: ['Nanoelectronic Carbon Dioxide Sensors'],
  read_count: 0,
  esources: ['PUB_HTML'],
  citation_count: 86,
  citation_count_norm: 17.2,
  '[citations]': { num_references: 32, num_citations: 86 },
  abstract: 'foo',
};

// Document without ASSOCIATED property
const docWithoutAssociated = {
  ...baseDoc,
  property: ['ARTICLE', 'ESOURCE', 'REFEREED'],
} as IDocsEntity;

// Document with ASSOCIATED property
const docWithAssociated = {
  ...baseDoc,
  property: ['ARTICLE', 'ESOURCE', 'REFEREED', 'ASSOCIATED'],
} as IDocsEntity;

// Document with no property field
const docWithoutProperty = {
  ...baseDoc,
  // property field is omitted
} as IDocsEntity;

describe('AbstractSources', () => {
  beforeEach(() => {
    server.resetHandlers();

    server.use(
      rest.get('/export/manifest', (req, res, ctx) => {
        return res(ctx.json([]));
      }),
    );
  });

  test('renders as accordion without crashing', () => {
    render(<AbstractSources doc={docWithoutAssociated} style="accordion" />);
  });

  test('renders as menu without crashing', () => {
    render(<AbstractSources doc={docWithoutAssociated} style="menu" />);
  });

  test('makes associated request when property contains ASSOCIATED', async () => {
    const resolverSpy = vi.fn();
    server.use(
      rest.get(apiHandlerRoute(ApiTargets.RESOLVER, '/:bibcode/associated'), (req, res, ctx) => {
        resolverSpy({
          bibcode: req.params.bibcode,
          linkType: 'associated',
        });
        return res(
          ctx.json({
            links: { count: 0, records: [] },
          }),
        );
      }),
    );

    render(<AbstractSources doc={docWithAssociated} style="accordion" />);

    await waitFor(() => {
      expect(resolverSpy).toHaveBeenCalledWith({
        bibcode: '2004AdM....16.2049S',
        linkType: 'associated',
      });
    });
  });

  test('does NOT make associated request when property does not contain ASSOCIATED', async () => {
    const resolverSpy = vi.fn();
    server.use(
      rest.get(apiHandlerRoute(ApiTargets.RESOLVER, '/:bibcode/associated'), (req, res, ctx) => {
        resolverSpy({
          bibcode: req.params.bibcode,
          linkType: 'associated',
        });
        return res(
          ctx.json({
            links: { count: 0, records: [] },
          }),
        );
      }),
    );

    render(<AbstractSources doc={docWithoutAssociated} style="accordion" />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(resolverSpy).not.toHaveBeenCalled();
  });

  test('does NOT make associated request when property field is undefined', async () => {
    const resolverSpy = vi.fn();
    server.use(
      rest.get(apiHandlerRoute(ApiTargets.RESOLVER, '/:bibcode/associated'), (req, res, ctx) => {
        resolverSpy({
          bibcode: req.params.bibcode,
          linkType: 'associated',
        });
        return res(
          ctx.json({
            links: { count: 0, records: [] },
          }),
        );
      }),
    );

    render(<AbstractSources doc={docWithoutProperty} style="accordion" />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(resolverSpy).not.toHaveBeenCalled();
  });

  test('accordion shows "Open" badge for open sources', () => {
    const doc = {
      ...baseDoc,
      esources: ['EPRINT_PDF'],
      property: ['EPRINT_OPENACCESS'],
      bibcode: '2004AdM....16.2049S',
    } as IDocsEntity;

    const { getByText, getByLabelText } = render(<AbstractSources doc={doc} style="accordion" />);

    expect(getByText('Open')).toBeDefined();
    expect(getByLabelText(/Preprint.*PDF.*Open/i)).toBeDefined();
  });

  test('accordion shows "Paid" badge for closed sources', () => {
    const doc = {
      ...baseDoc,
      esources: ['PUB_HTML'],
      property: [],
      bibcode: '2004AdM....16.2049S',
    } as IDocsEntity;

    const { getByText, getByLabelText } = render(<AbstractSources doc={doc} style="accordion" />);

    expect(getByText('Paid')).toBeDefined();
    expect(getByLabelText(/Publisher.*HTML.*Paid/i)).toBeDefined();
  });

  test('menu shows "Open" tag for open sources', async () => {
    const doc = {
      ...baseDoc,
      esources: ['EPRINT_PDF'],
      property: ['EPRINT_OPENACCESS'],
      bibcode: '2004AdM....16.2049S',
    } as IDocsEntity;

    const { getByRole, getByText } = render(<AbstractSources doc={doc} style="menu" />);

    const button = getByRole('button', { name: /Full Text Sources/i });
    button.click();

    await waitFor(() => {
      expect(getByText(/Preprint PDF/)).toBeDefined();
      expect(getByText('Open')).toBeDefined();
    });
  });

  test('menu shows "Paid" tag for closed sources', async () => {
    const doc = {
      ...baseDoc,
      esources: ['PUB_HTML'],
      property: [],
      bibcode: '2004AdM....16.2049S',
    } as IDocsEntity;

    const { getByRole, getByText } = render(<AbstractSources doc={doc} style="menu" />);

    const button = getByRole('button', { name: /Full Text Sources/i });
    button.click();

    await waitFor(() => {
      expect(getByText(/Publisher HTML/)).toBeDefined();
      expect(getByText('Paid')).toBeDefined();
    });
  });
});
