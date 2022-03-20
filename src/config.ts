export const APP_DEFAULTS = {
  DETAILS_MAX_AUTHORS: 50 as const,
  RESULT_PER_PAGE: 10 as const,
  PER_PAGE_OPTIONS: [10, 25, 50, 100] as const,
} as const;

export type NumPerPageOption = typeof APP_DEFAULTS['PER_PAGE_OPTIONS'][number];
