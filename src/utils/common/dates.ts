import { intlFormat, intlFormatDistance } from 'date-fns';

export const DATE_LOCALE = 'en-US';

export const formatRelativeDate = (date: Date, baseDate: Date = new Date()): string =>
  intlFormatDistance(date, baseDate, { locale: DATE_LOCALE });

export const formatAbsoluteDateTime = (date: Date): string =>
  intlFormat(
    date,
    {
      hour12: false,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
    { locale: DATE_LOCALE },
  );
