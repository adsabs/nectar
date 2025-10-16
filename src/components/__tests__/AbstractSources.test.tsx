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
    // Reset all handlers before each test
    server.resetHandlers();

    // Add a default mock for export endpoint to prevent errors
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
    // Set up a spy on the resolver endpoint that only captures associated requests
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

    // Wait for the component to make the API call
    await waitFor(() => {
      expect(resolverSpy).toHaveBeenCalledWith({
        bibcode: '2004AdM....16.2049S',
        linkType: 'associated',
      });
    });
  });

  test('does NOT make associated request when property does not contain ASSOCIATED', async () => {
    // Set up a spy on the resolver endpoint that only captures associated requests
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

    // Wait a bit to ensure no API call is made
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify that no call to the associated endpoint was made
    expect(resolverSpy).not.toHaveBeenCalled();
  });

  test('does NOT make associated request when property field is undefined', async () => {
    // Set up a spy on the resolver endpoint that only captures associated requests
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

    // Wait a bit to ensure no API call is made
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify that no call to the associated endpoint was made
    expect(resolverSpy).not.toHaveBeenCalled();
  });
});
