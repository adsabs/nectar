import { Periodical, PublicationVolume } from 'schema-dts';
import { IDocsEntity } from '@/api/search/types';
import { pathOr } from 'ramda';

const getPub = pathOr<string>('', ['pub']);
const getPubRaw = pathOr<string>('', ['pub_raw']);

/**
 * Convert ADS pub and pub_raw fields into Periodical or PublicationVolume.
 */
export function volumeTransform(doc: Partial<IDocsEntity>): Periodical | PublicationVolume | undefined {
  const pub = getPub(doc);
  const pub_raw = getPubRaw(doc);

  const journalName = (pub ?? '').trim();
  if (!journalName) {
    return undefined;
  }

  // Try to extract volume + A6-like code
  const raw = pub_raw ?? '';
  const volMatch = raw.match(/Volume\s+(\d+)/i);
  const idMatch = raw.match(/\bid\.([A-Za-z0-9]+)\b/);

  const periodical: Periodical = { '@type': 'Periodical', name: journalName };
  if (!volMatch) {
    return periodical;
  }

  const vol: PublicationVolume = {
    '@type': 'PublicationVolume',
    volumeNumber: volMatch[1],
    isPartOf: periodical,
  };

  // Attach pagination (article code) if present
  if (idMatch) {
    vol.pagination = idMatch[1];
  }

  return vol;
}
