import { isNilOrEmpty } from 'ramda-adjunct';

/**
 * Parses a publication date string and returns an object containing the year, month, and day.
 *
 * If the publication date is in `YYYY-MM-DD` format, it extracts the year, month, and day.
 * If the publication date is in `YYYY-MM` format, it extracts the year and month, and the day is set to '00'.
 *
 * @param {string} pubdate - The publication date string to parse.
 * @returns {{ year: string; month: string; day: string } | null} An object with `year`, `month`, and `day` properties or null if the input is invalid.
 */
export const parsePublicationDate = (pubdate: string): { year: string; month: string; day: string } | null => {
  if (isNilOrEmpty(pubdate)) {
    return null;
  }

  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match: RegExpExecArray | null = regex.exec(pubdate);

  // handle dates with year, month, and day
  if (match && match.length === 4) {
    return { year: match[1], month: match[2], day: match[3] };
  } else {
    // handle dates with only year and month
    const year = pubdate.slice(0, 4);
    const monthMatch = /^(\d{4})-(\d{2})$/.exec(pubdate);
    const month = monthMatch ? monthMatch[2] : '00';
    return { year, month, day: '00' };
  }
};
