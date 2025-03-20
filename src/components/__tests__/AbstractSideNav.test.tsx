import { render } from '@/test-utils';
import { test, vi } from 'vitest';
import { AbstractSideNav } from '@/components/AbstractSideNav';
import { IDocsEntity } from '@/api/search/types';

const mocks = vi.hoisted(() => ({
  useRouter: () => ({
    query: { id: 'foo' },
    asPath: '/abstract',
  }),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

const doc =
  '{"bibcode":"2004AdM....16.2049S","author":["Star, A.","Han, T. -R.","Joshi, V.","Gabriel, J. -C. P.","Grüner, G."],"author_count":5,"bibstem":["AdM","AdM....16"],"doi":["10.1002/adma.200400322"],"id":"21843905","identifier":["2004AdM....16.2049S","10.1002/adma.200400322"],"orcid_pub":["-","-","-","-","-"],"pub":"Advanced Materials","pub_raw":"Advanced Materials, vol. 16, issue 22, pp. 2049-2052","pubdate":"2004-11-00","title":["Nanoelectronic Carbon Dioxide Sensors"],"read_count":0,"esources":["PUB_HTML"],"property":["ARTICLE","ESOURCE","REFEREED"],"citation_count":86,"citation_count_norm":17.2,"[citations]":{"num_references":32,"num_citations":86},"abstract":"foo"}';

test('renders without crashing', () => {
  render(<AbstractSideNav doc={JSON.parse(doc) as IDocsEntity} />);
});
