import { IOrcidWork } from '@/api/orcid/types';

import { append, find, head, identity, map, over, pipe, set, startsWith, unless, view, when } from 'ramda';
import { isNilOrEmpty, isString } from 'ramda-adjunct';
import { adsDocLenses, convertDocType, orcidLenses } from '@/lib/orcid/helpers';
import { Contributor, ExternalID } from '@/api/orcid/types/orcid-work';
import { IOrcidProfileEntry } from '@/api/orcid/types/orcid-profile';
import { coalesceAuthorsFromDoc } from '@/utils/common/coalesceAuthorsFromDoc';
import { parsePublicationDate } from '@/utils/common/parsePublicationDate';
import { IDocsEntity } from '@/api/search/types';

const MAX_ABSTRACT_LENGTH = 4997;

const doIfExists = <V, T = IOrcidWork>(value: V, cb: (doc: T) => T) => unless(() => isNilOrEmpty(value), cb);

export const transformADStoOrcid = (adsRecord: IDocsEntity, putcode?: IOrcidProfileEntry['putcode']) => {
  const pubdate = view(adsDocLenses.pubdate, adsRecord) ?? '';
  const abstract = view(adsDocLenses.abstract, adsRecord) ?? '';
  const bibcode = view(adsDocLenses.bibcode, adsRecord) ?? '';
  const pub = view(adsDocLenses.pub, adsRecord) ?? '';
  const doctype = view(adsDocLenses.doctype, adsRecord) ?? '';
  const doi = view(adsDocLenses.doi, adsRecord) ?? [];
  const title = view(adsDocLenses.title, adsRecord) ?? [];
  const identifier = view(adsDocLenses.identifier, adsRecord) ?? [];

  const arxivId = find(startsWith('arxiv'), identifier);
  const date = parsePublicationDate(pubdate);
  const authors = coalesceAuthorsFromDoc(adsRecord);

  return pipe(
    // EXTERNAL IDS
    doIfExists(bibcode, addExternalId('bibcode', bibcode)),
    doIfExists(doi, addExternalId('doi', head(doi))),
    doIfExists(arxivId, addExternalId('arxiv', arxivId)),

    // PUBLICATION DATE
    doIfExists(
      date,
      pipe(
        doIfExists(date?.year, set(orcidLenses.publicationDateYear, date?.year)),
        unless(() => date?.month === '00', set(orcidLenses.publicationDateMonth, date?.month)),
        unless(() => date?.day === '00', set(orcidLenses.publicationDateDay, date?.day)),
      ),
    ),

    // AUTHORS
    doIfExists(
      authors,
      set(
        orcidLenses.contributor,
        check(
          authors,
          map(([position, name, orcid]) =>
            pipe(
              set(orcidLenses.contributorName, check(name, identity)),
              set(orcidLenses.contributorRole, 'AUTHOR'),
              set(orcidLenses.contributorSequence, position === '1' ? 'FIRST' : 'ADDITIONAL'),
              doIfExists(
                orcid,
                pipe(
                  set(orcidLenses.contributorOrcidPath, isString(orcid) ? orcid : null),
                  set(orcidLenses.contributorOrcidHost, 'orcid.org'),
                  set(orcidLenses.contributorOrcidUri, isString(orcid) ? `http://orcid.org/${orcid}` : null),
                ),
              ),
            )({} as Contributor),
          ),
        ),
      ),
    ),

    // ...rest
    doIfExists(putcode, set(orcidLenses.putCode, `${putcode}`)),
    doIfExists(abstract, set(orcidLenses.shortDescription, abstract.slice(0, MAX_ABSTRACT_LENGTH))),
    doIfExists(pub, set(orcidLenses.journalTitle, pub)),
    doIfExists(doctype, set(orcidLenses.type, convertDocType(doctype))),
    doIfExists(title, set(orcidLenses.title, head(title))),
  )({} as IOrcidWork);
};
const addExternalId = (type: string, value?: string) => {
  const entry = pipe(
    set(orcidLenses.externalIdType, type),
    set(orcidLenses.externalIdValue, value),
    set(orcidLenses.externalIdRelationship, 'SELF'),
  )({} as ExternalID);

  return when<IOrcidWork, IOrcidWork>(() => isString(value), over(orcidLenses.externalId, append(entry)));
};

const check = <T, R = T>(value: T, cb: (value: T) => R) => (isNilOrEmpty(value) ? null : cb(value));
