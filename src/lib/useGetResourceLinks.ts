import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export const resourceUrlTypes = ['arXiv', 'PDF', 'DOI', 'HTML', 'Other'] as const;

export type ResourceUrlType = typeof resourceUrlTypes[number];
export interface IResourceUrl {
  type: ResourceUrlType;
  url: string;
}
interface IUseResourceLinksProps {
  identifier: string;
  options?: UseQueryOptions<IResourceUrl[]>;
}

const SKIP_URLS = [
  'http://www.cfa.harvard.edu/sao',
  'https://www.cfa.harvard.edu/',
  'http://www.si.edu',
  'http://www.nasa.gov',
];

export const useGetResourceLinks = ({ identifier, options }: IUseResourceLinksProps) => {
  const url = `/link_gateway/${encodeURIComponent(identifier)}/ESOURCE`;

  // url regex, skip internal links
  const reg = /href="(https?:\/\/[^"]*)"/gi;

  const data = useQuery<IResourceUrl[]>(
    ['resourceLink', identifier],
    async () => {
      const res = await fetch(url);
      const raw = await res.text();
      if (!!raw) {
        return (
          Array.from(
            new Set(raw.matchAll(reg)),
            (e) =>
              ({
                type: e[1].includes('arxiv')
                  ? ('arXiv' as IResourceUrl['type'])
                  : e[1].includes('pdf')
                  ? ('PDF' as IResourceUrl['type'])
                  : e[1].includes('doi')
                  ? ('DOI' as IResourceUrl['type'])
                  : ('HTML' as IResourceUrl['type']),
                url: e[1],
              } as IResourceUrl),
          )
            .slice(1)

            // filter out urls based on a skip list
            .filter((u) => !SKIP_URLS.includes(u.url))
        );
      }
      return [] as IResourceUrl[];
    },
    options,
  );
  return data;
};
