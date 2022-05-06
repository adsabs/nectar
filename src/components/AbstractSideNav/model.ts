import { IDocsEntity } from '@api';
import type {} from '@heroicons/react/outline';

export enum Routes {
  ABSTRACT = 'abstract',
  CITATIONS = 'citations',
  REFERENCES = 'references',
  COREADS = 'coreads',
  SIMILAR = 'similar',
  VOLUMECONTENT = 'toc',
  GRAPHICS = 'graphics',
  METRICS = 'metrics',
  EXPORT = 'exportcitation',
}

export const abstractPageNavDefaultQueryFields: Partial<keyof IDocsEntity>[] = [
  'citation_count',
  '[citations]',
  'read_count',
  'abstract',
  'property',
];
