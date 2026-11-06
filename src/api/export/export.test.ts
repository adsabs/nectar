import { rest } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { ApiTargets } from '@/api/models';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { server } from '@/mocks/server';

import { fetchExportCitation } from './export';
import { IExportApiParams } from './types';

const bodies: Record<string, unknown>[] = [];
const paths: string[] = [];

const captureExportRequests = () =>
  server.use(
    rest.post(apiHandlerRoute(ApiTargets.EXPORT, '/:format'), async (req, res, ctx) => {
      bodies.push((await req.json()) as Record<string, unknown>);
      paths.push(new URL(req.url).pathname);
      return res(ctx.status(200), ctx.json({ export: 'citation text' }));
    }),
  );

const fetchWith = (params: IExportApiParams) =>
  fetchExportCitation({ queryKey: ['exportcitation', { params }], meta: { params } } as never);

beforeEach(() => {
  bodies.length = 0;
  paths.length = 0;
  captureExportRequests();
});

describe('fetchExportCitation', () => {
  it('posts to the route named by the format', async () => {
    await fetchWith({ format: 'apsj', bibcode: ['2003NanoL...3..459S'] });

    expect(paths[0]).toBe(`${ApiTargets.EXPORT}/apsj`);
  });

  it('sends no format field for a curated format', async () => {
    await fetchWith({ format: 'bibtex', bibcode: ['2003NanoL...3..459S'] });

    expect(bodies[0]).not.toHaveProperty('format');
    expect(bodies[0].bibcode).toEqual(['2003NanoL...3..459S']);
  });

  it('sends the custom template as the body’s format field (criterion 3)', async () => {
    await fetchWith({ format: 'custom', customFormat: '%1H:%Y:%q', bibcode: ['2003NanoL...3..459S'] });

    expect(paths[0]).toBe(`${ApiTargets.EXPORT}/custom`);
    expect(bodies[0].format).toBe('%1H:%Y:%q');
  });

  it('never leaks customFormat under its own key', async () => {
    await fetchWith({ format: 'custom', customFormat: '%1H:%Y:%q', bibcode: ['2003NanoL...3..459S'] });

    expect(bodies[0]).not.toHaveProperty('customFormat');
  });

  it('ignores a stray customFormat on a curated format', async () => {
    await fetchWith({ format: 'agu', customFormat: '%1H:%Y:%q', bibcode: ['2003NanoL...3..459S'] });

    expect(bodies[0]).not.toHaveProperty('format');
    expect(bodies[0]).not.toHaveProperty('customFormat');
  });

  it('returns the citation the service produced', async () => {
    const result = await fetchWith({ format: 'bibtex', bibcode: ['2003NanoL...3..459S'] });

    expect(result.export).toBe('citation text');
  });

  it('passes bibtex parameters through untouched', async () => {
    await fetchWith({
      format: 'bibtex',
      bibcode: ['2003NanoL...3..459S'],
      keyformat: ['%1H+%Y'],
      maxauthor: [10],
    });

    expect(bodies[0].keyformat).toEqual(['%1H+%Y']);
    expect(bodies[0].maxauthor).toEqual([10]);
  });
});
