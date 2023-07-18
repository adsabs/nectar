import { ArrayChange, Change, diffArrays, diffWords } from 'diff';
import { DiffSection, FormValues } from './types';
export interface IProcessedFormValues {
  bibcode: string;
  comments: string;
  publication: string;
  pubDate: string;
  title: string;
  abstract: string;
  keywords: string[];
  authors: string[];
  affiliation: string[];
  orcid: string[];
  collection: string[];
  urls: string[];
  references: string[];
}

type ProcessedFormKey = keyof IProcessedFormValues;

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

export const processFormValues = (formValues: FormValues): IProcessedFormValues => {
  const { bibcode, collection, title, authors, publication, pubDate, urls, abstract, keywords, references, comments } =
    formValues;

  return {
    bibcode,
    comments,
    publication,
    pubDate,
    title,
    abstract,
    keywords,
    authors: authors.map((author) => author.name),
    affiliation: authors.map(({ aff }) => aff),
    orcid: authors.map(({ orcid }) => orcid),
    collection: collection.map((c) => c as string),
    urls: urls.map((u) => `${u.type} : ${u.url}`),
    references: references.map((r) => `(${r.type}) : ${r.reference}`),
  };
};

export const getDiffSections = (leftValues: FormValues, rightValues: FormValues): DiffSection[] => {
  const left = processFormValues(leftValues);
  const right = processFormValues(rightValues);

  const sectionsChanges: DiffSection[] = Object.entries(left).map(([key, value]) => {
    const isArray = Array.isArray(value);

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
    } catch (e) {
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
