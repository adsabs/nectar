import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { isValidURL } from '@/utils/common/isValidURL';

export const resourceUrlTypes = ['arXiv', 'PDF', 'DOI', 'HTML', 'Other'] as const;

export type ResourceUrlType = (typeof resourceUrlTypes)[number];

export interface IResourceUrl {
  type: ResourceUrlType;
  url: string;
}

interface IUseResourceLinksProps {
  identifier: string;
  options?: UseQueryOptions<IResourceUrl[]>;
}

const URL_TYPE_MAP: Record<string, ResourceUrlType> = {
  arxiv: 'arXiv',
  pdf: 'PDF',
  doi: 'DOI',
  html: 'HTML',
};

const RESOURCE_EXT_REGEX = /\.(jpg|jpeg|png|gif|webp|svg|css|js|ico|woff2?|ttf|otf|eot|map|mp4|webm)(\?|$)/i;

/**
 * Transforms a URL into a structured resource link object.
 * @param url
 */
export const transformUrl = (url: string) => {
  if (!url || typeof url !== 'string' || !isValidURL(url) || RESOURCE_EXT_REGEX.test(url)) {
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

  if (!res.ok) {
    return [];
  }

  // single-link resources redirect directly to the target URL
  if (res.redirected) {
    const transformedUrl = transformUrl(res.url);
    return transformedUrl ? [transformedUrl] : [];
  }

  const raw = await res.text();
  if (!raw) {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'text/html');
  const links = doc.querySelectorAll('.list-group-item a');

  const seen = new Set<string>();
  const output: IResourceUrl[] = [];

  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) {
      continue;
    }
    const transformed = transformUrl(href);
    if (transformed && !seen.has(transformed.url)) {
      seen.add(transformed.url);
      output.push(transformed);
    }
  }

  return output;
};

export const useGetResourceLinks = ({ identifier, options }: IUseResourceLinksProps) => {
  return useQuery<IResourceUrl[]>(['resourceLink', identifier], () => fetchUrl(identifier), options);
};
