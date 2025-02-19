import { ArrayChange, Change, diffArrays, diffWords } from 'diff';
import { DiffSection, FormValues } from './types';
import { IRecordParams } from '@/api/feedback/types';
import { logger } from '@/logger';

type ProcessedFormKey = keyof IRecordParams;

const labels: { [key in ProcessedFormKey]: string } = {
  bibcode: 'Bibcode',
  comments: 'Comments',
  publication: 'Publication',
  pubDate: 'Publication Date',
  title: 'Title',
  abstract: 'Abstract',
  keywords: 'Keywords',
  authors: 'Authors',
  affiliation: 'Affiliation',
  orcid: 'ORCiD',
  collection: 'Collection',
  urls: 'URLs',
  references: 'References',
};

export const processFormValues = (formValues: FormValues): IRecordParams => {
  const { bibcode, collection, title, authors, publication, pubDate, urls, abstract, keywords, references, comments } =
    formValues;

  return {
    bibcode,
    comments,
    publication,
    pubDate,
    title,
    abstract,
    keywords: keywords.map((keyword) => keyword.value),
    authors: authors.map((author) => author.name),
    affiliation: authors.map(({ aff }) => aff),
    orcid: authors.map(({ orcid }) => orcid),
    collection: collection.map((c) => c as string),
    urls: urls.map((u) => `(${u.type}) ${u.url}`),
    references: references.map((r) => `(${r.type}) ${r.reference}`),
  };
};

export const getDiffSections = (leftValues: FormValues, rightValues: FormValues): DiffSection[] => {
  const left = processFormValues(leftValues);
  const right = processFormValues(rightValues);

  const sectionsChanges: DiffSection[] = Object.entries(left).map(([key, value]) => {
    const isArray = Array.isArray(value);

    let changes: (ArrayChange<string> | Change)[] = [];

    try {
      if (isArray) {
        changes = diffArrays<string, string>(value as string[], right[key as ProcessedFormKey] as string[]);
      } else if (typeof value === 'string') {
        changes = diffWords(value, right[key as ProcessedFormKey] as string);
      }
    } catch (err) {
      logger.error({ err, key, value, isArray, left, right }, 'Error caught while attempting to diff sections');
      return null;
    }

    return changes.length === 1 && (changes[0].count === 0 || (!changes[0].added && !changes[0].removed))
      ? null
      : {
          label: labels[key as ProcessedFormKey],
          changes,
          type: isArray ? 'array' : 'text',
          newValue: right[key as ProcessedFormKey] as string,
        };
  });

  // remove nulls
  return sectionsChanges.filter((s) => s);
};

export const getDiffString = (leftValues: FormValues, rightValues: FormValues) => {
  const left = processFormValues(leftValues);
  const right = processFormValues(rightValues);

  const sections = Object.entries(left).map(([key, value]) => {
    const isArray = Array.isArray(value);

    // skip array entries that were empty to begin with
    if (isArray && value.length === 0) {
      return null;
    }

    let changes: (ArrayChange<string> | Change)[] = [];

    try {
      if (isArray) {
        changes = diffArrays<string, string>(value as string[], right[key as ProcessedFormKey] as string[]);
      } else if (typeof value === 'string') {
        changes = diffWords(value, right[key as ProcessedFormKey] as string);
      }
    } catch (err) {
      logger.error({ err, changes, left, right, sections }, 'Error caught while attempting to diff strings');
      return null;
    }

    if (changes.length === 1 && (changes[0].count === 0 || (!changes[0].added && !changes[0].removed))) {
      return null;
    }

    return `
  >>>> ${labels[key as ProcessedFormKey]}
  ${isArray ? stringifyArrayChanges(changes as ArrayChange<string>[]) : stringifyWordChanges(changes as Change[])}
  <<<<`;
  });

  return sections.filter((s) => s).join('\n');
};

const stringifyArrayChanges = (changes: ArrayChange<string>[]) => {
  // spread out entries
  const entries = changes.reduce<{ value: string; count: number; added?: boolean; removed?: boolean }[]>(
    (acc, change) => {
      return [...acc, ...change.value.map((v) => ({ count: 1, ...change, value: v }))];
    },
    [],
  );

  const out = [];
  let index = 1;
  for (let i = 0, j = 1; i < entries.length; i += 1, j = i + 1) {
    const count = entries[i].count ?? 1;
    if (count > 1 && entries[i].removed && entries[i + count]?.count > 1 && entries[i + count]?.added) {
      // actual change made to multiple entries in a row, they are matched by index, not sequential

      out.push(`${index} ${strikeText(entries[i].value)}${entries[i + count].value}`);
      entries[i + count] = {
        count: entries[i + count].count,
        value: entries[i + count].value,
      };
      index += 1;
    } else if (entries[i].removed && entries[j] && entries[j].added) {
      // actual change made, this should show up as text struck through

      out.push(`${index} ${strikeText(entries[i].value)}${entries[j].value}`);
      entries[j] = { value: entries[j].value, count: entries[j].count };
      index += 1;
    } else if (entries[i].removed) {
      // entry fully removed from the list, strike through full string including index

      out.push(strikeText(`${index} ${entries[i].value}`));
      index += 1;
    } else if (entries[i].added) {
      // added entry, just add a +

      out.push(`+ ${index} ${entries[i].value}`);
      index += 1;
    } else if (entries[i].count > 1 && !entries[i].added && !entries[i].removed) {
      // these are just extra values in between, we're just skipping them for now
      index += 1;
    }
  }
  return out.join('\n');
};

const stringifyWordChanges = (changes: Change[]) => {
  let didTruncate = false;
  const output = changes.reduce((acc: string, change) => {
    if (change.removed) {
      acc += strikeText(change.value);
    } else {
      if (change.value.length > 60) {
        didTruncate = true;
        acc += change.value.slice(0, 60);
      } else {
        acc += change.value;
      }
    }
    return acc;
  }, '');
  if (didTruncate) {
    return `...${output}...`;
  }
  return output;
};

const strikeText = (str: string) => {
  return str
    .split('')
    .map((c) => c + '\u0336')
    .join('');
};
