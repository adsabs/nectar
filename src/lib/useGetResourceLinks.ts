import { IUrl } from '@components';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface IUseResourceLinksProps {
  identifier: string;
  options?: UseQueryOptions<IUrl[]>;
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

  const data = useQuery<IUrl[]>(
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
                  ? ('arXiv' as IUrl['type'])
                  : e[1].includes('pdf')
                  ? ('PDF' as IUrl['type'])
                  : e[1].includes('doi')
                  ? ('DOI' as IUrl['type'])
                  : ('HTML' as IUrl['type']),
                url: e[1],
              } as IUrl),
          )
            .slice(1)

            // filter out urls based on a skip list
            .filter((u) => !SKIP_URLS.includes(u.url))
        );
      }
      return [] as IUrl[];
    },
    options,
  );
  return data;
};
