import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { isValidURL } from '@/utils/common/isValidURL';

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

// TODO: slightly brittle, since these links could change over time
const SKIP_URLS = [
  'http://www.cfa.harvard.edu/sao',
  'https://www.cfa.harvard.edu/',
  'http://www.si.edu',
  'http://www.nasa.gov',
];

const URL_TYPE_MAP: Record<string, ResourceUrlType> = {
  arxiv: 'arXiv',
  pdf: 'PDF',
  doi: 'DOI',
  html: 'HTML',
};

const RESOURCE_EXT_REGEX = /\.(jpg|jpeg|png|gif|webp|svg|css|js|ico|woff2?|ttf|otf|eot|map|mp4|webm)(\?|$)/i;
const URL_REGX = /href="(https?:\/\/[^"]*)"/gi;

/**
 * Transforms a URL into a structured resource link object.
 * @param url
 */
export const transformUrl = (url: string) => {
  if (!url || typeof url !== 'string' || !isValidURL(url) || RESOURCE_EXT_REGEX.test(url) || SKIP_URLS.includes(url)) {
    return null;
  }

  const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
  const urlType = Object.keys(URL_TYPE_MAP).find((key) => normalizedUrl.includes(key));
  const type = urlType ? URL_TYPE_MAP[urlType] : 'HTML';
  return { type, url: normalizedUrl } as IResourceUrl;
};

/**
 * Fetches resource links for a given identifier.
 * @param identifier
 */
export const fetchUrl = async (identifier: string): Promise<IResourceUrl[]> => {
  const url = `/link_gateway/${encodeURIComponent(identifier)}/ESOURCE`;
  const res = await fetch(url);

  // check for 302 redirects
  if (res.status === 302 || res.status === 301) {
    const redirectUrl = res.headers.get('Location');
    if (redirectUrl) {
      const transformedUrl = transformUrl(redirectUrl);
      return transformedUrl ? [transformedUrl] : [];
    }
    return [];
  }

  const raw = await res.text();
  if (!raw) {
    return [];
  }

  const seen = new Set<string>();
  const result = Array.from(raw.matchAll(URL_REGX), ([, href]) => transformUrl(href));

  const output: IResourceUrl[] = [];
  for (const res of result) {
    if (res && !seen.has(res.url)) {
      seen.add(res.url);
      output.push(res);
    }
  }

  return output;
};

export const useGetResourceLinks = ({ identifier, options }: IUseResourceLinksProps) => {
  return useQuery<IResourceUrl[]>(['resourceLink', identifier], () => fetchUrl(identifier), options);
};
