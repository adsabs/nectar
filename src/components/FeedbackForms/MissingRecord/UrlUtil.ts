import { ResourceUrlType, IResourceUrl } from './types';

const URL_TYPE_MAP: Record<string, ResourceUrlType> = {
  arxiv: 'arXiv',
  pdf: 'PDF',
  doi: 'DOI',
  html: 'HTML',
};

const RESOURCE_EXT_REGEX = /\.(jpg|jpeg|png|gif|webp|svg|css|js|ico|woff2?|ttf|otf|eot|map|mp4|webm)(\?|$)/i;

const isValidUrl = (url: string) => {
  try {
    const tempUrl = new URL(url);
    return ['http:', 'https:'].includes(tempUrl.protocol);
  } catch {
    return false;
  }
};

/**
 * Transforms a URL into a structured resource link object.
 * @param url
 */
export const transformUrl = (url: string) => {
  if (!url || typeof url !== 'string' || !isValidUrl(url) || RESOURCE_EXT_REGEX.test(url)) {
    return null;
  }

  const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
  const urlType = Object.keys(URL_TYPE_MAP).find((key) => normalizedUrl.includes(key));
  const type = urlType ? URL_TYPE_MAP[urlType] : 'HTML';
  return { type, url: normalizedUrl } as IResourceUrl;
};
