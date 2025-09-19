import type { MediaObject } from 'schema-dts';
import { processLinkData } from '@/components/AbstractSources/linkGenerator';
import { IDocsEntity } from '@/api/search/types';
import { logger } from '@/logger';

const MIME_BY_TYPE: Record<string, string> = {
  PDF: 'application/pdf',
  HTML: 'text/html',
};

/**
 * Build schema.org MediaObject encodings from ADS full text sources.
 */
export function encodingTransform(doc: Partial<IDocsEntity>, absoluteBase: string): MediaObject[] {
  const { fullTextSources } = processLinkData(doc as IDocsEntity);
  const out: MediaObject[] = [];

  for (const s of fullTextSources ?? []) {
    try {
      const encodingFormat = MIME_BY_TYPE[(s.type || '').toUpperCase()] || undefined;
      const contentUrl = new URL(s.url, absoluteBase).toString();
      out.push({
        '@type': 'MediaObject',
        contentUrl,
        name: s.name || s.shortName || undefined,
        description: s.description || undefined,
        encodingFormat,
      });
    } catch (err) {
      logger.error({ err, source: s, absoluteBase }, 'encodingTransform URL build failed');
    }
  }

  return out;
}
