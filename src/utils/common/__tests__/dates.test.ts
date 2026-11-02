import { beforeEach, describe, expect, test, vi } from 'vitest';
import { intlFormat, intlFormatDistance } from 'date-fns';
import { formatAbsoluteDateTime, formatRelativeDate } from '../dates';

vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('date-fns')>();
  return {
    ...actual,
    intlFormat: vi.fn(actual.intlFormat),
    intlFormatDistance: vi.fn(actual.intlFormatDistance),
  };
});

const DATE = new Date('2024-03-15T12:00:00+00:00');
const BASE_DATE = new Date('2024-03-20T12:00:00+00:00');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('date locale pinning', () => {
  test('formatRelativeDate passes an explicit en-US locale', () => {
    formatRelativeDate(DATE, BASE_DATE);

    expect(intlFormatDistance).toHaveBeenCalledWith(DATE, BASE_DATE, { locale: 'en-US' });
  });

  test('formatAbsoluteDateTime passes an explicit en-US locale', () => {
    formatAbsoluteDateTime(DATE);

    expect(intlFormat).toHaveBeenCalledWith(DATE, expect.any(Object), { locale: 'en-US' });
  });

  test('formatAbsoluteDateTime keeps the 24-hour short-month option bag', () => {
    formatAbsoluteDateTime(DATE);

    expect(intlFormat).toHaveBeenCalledWith(
      DATE,
      {
        hour12: false,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
      { locale: 'en-US' },
    );
  });
});
