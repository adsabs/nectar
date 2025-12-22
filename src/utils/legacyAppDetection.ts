const LEGACY_APP_DOMAINS = [
  'ui.adsabs.harvard.edu',
  'devui.adsabs.harvard.edu',
  'qa.adsabs.harvard.edu',
  'dev.adsabs.harvard.edu',
];

export const isFromLegacyApp = (referer?: string): boolean => {
  if (!referer) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);
    return LEGACY_APP_DOMAINS.includes(refererUrl.hostname);
  } catch {
    return false;
  }
};
