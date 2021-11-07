import getConfig from 'next/config';
/**
 * Figure out which config to pick, based on the current environment
 */
export const resolveApiBaseUrl = (defaultBaseUrl = ''): string => {
  const config = getConfig();

  if (typeof config === 'undefined') {
    return defaultBaseUrl;
  }

  if (typeof window === 'undefined') {
    return config.serverRuntimeConfig?.apiHost ?? defaultBaseUrl;
  }
  return config.publicRuntimeConfig?.apiHost ?? defaultBaseUrl;
};
