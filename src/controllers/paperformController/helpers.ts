import { stringifyUrlParams } from '@utils';
import DOMPurify from 'isomorphic-dompurify';
import { head, pipe } from 'ramda';
import { PaperFormParams } from './types';

export const stringify = (params: Record<string, string>) => stringifyUrlParams(params, { indices: false });
const escape = (val?: string): string => (typeof val === 'string' ? DOMPurify.sanitize(val) : '');
const listSanitizer = (v: string): string[] =>
  v.length > 0 ? (Array.from(v.matchAll(/[^\r\n]+/g), head) as string[]) : [];

export const checks = {
  listCheck: pipe<string, string, string[]>(escape, listSanitizer),
  escape: (val: string) => escape(val),
};

export const stringifiers = {
  journalForm({ bibstem, year, volume, page }: PaperFormParams) {
    const q = [];
    bibstem.length > 0 && q.push(`bibstem:${bibstem}`);
    year.length > 0 && q.push(`year:${year}`);
    volume.length > 0 && q.push(`volume:${volume}`);
    page.length > 0 && q.push(`page:${page}`);

    return stringify({ q: q.join(' ') });
  },
};
