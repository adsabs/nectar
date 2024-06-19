import { IValue } from '@/api/orcid/types/common';

export interface IOrcidName {
  'last-modified-date': IValue;
  name: {
    'created-date': IValue;
    'last-modified-date': IValue;
    'given-names': IValue;
    'family-name': IValue;
    'credit-name'?: unknown;
    source?: unknown;
    visibility: string;
    path: string;
  };
  'other-names': {
    'last-modified-date'?: unknown;
    'other-name': unknown[];
    path: string;
  };
  biography?: unknown;
  path: string;
}
