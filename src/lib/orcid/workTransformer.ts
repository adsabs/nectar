import { IDocsEntity } from '@api';
import { IOrcidWork } from '@api/orcid/types';
import {
  append,
  assoc,
  defaultTo,
  equals,
  find,
  head,
  map,
  over,
  pipe,
  set,
  startsWith,
  unless,
  view,
  when,
} from 'ramda';
import { isObject, isString } from 'ramda-adjunct';
import { parsePublicationDate } from '@utils';
import { adsDocLenses, convertDocType, orcidLenses } from '@lib/orcid/helpers';
import { Contributor, ExternalID } from '@api/orcid/types/orcid-work';

const MAX_ABSTRACT_LENGTH = 4997;

export const transformADStoOrcid = (adsRecord: IDocsEntity) => {
  const pubdate = view(adsDocLenses.pubdate, adsRecord);
  const abstract = view(adsDocLenses.abstract, adsRecord);
  const bibcode = view(adsDocLenses.bibcode, adsRecord);
  const pub = view(adsDocLenses.pub, adsRecord);
  const doi = view(adsDocLenses.doi, adsRecord);
  const author = view(adsDocLenses.author, adsRecord);
  const title = view(adsDocLenses.title, adsRecord);
  const doctype = view(adsDocLenses.doctype, adsRecord);
  const identifier = view(adsDocLenses.identifier, adsRecord);

  const arxivId = find(startsWith('arxiv'), identifier);
  const date = parsePublicationDate(pubdate);
  return pipe(
    // EXTERNAL IDS
    addExternalId('bibcode', bibcode),
    addExternalId('doi', head(doi)),
    addExternalId('arxiv', arxivId),

    // PUBLICATION DATE
    when(
      () => isObject(date),
      pipe(
        set(orcidLenses.publicationDateYear, date.year),
        unless(() => equals('00', date.month), set(orcidLenses.publicationDateMonth, date.month)),
        unless(() => equals('00', date.day), set(orcidLenses.publicationDateDay, date.day)),
      ),
    ),

    // AUTHORS
    set(
      orcidLenses.contributor,
      map(
        (author) =>
          pipe(set(orcidLenses.contributorName, author), set(orcidLenses.contributorRole, 'AUTHOR'))({} as Contributor),
        author,
      ),
    ),

    // ...rest
    set(orcidLenses.shortDescription, abstract.slice(0, MAX_ABSTRACT_LENGTH)),
    set(orcidLenses.journalTitle, pub),
    set(orcidLenses.type, convertDocType(doctype)),
    set(orcidLenses.title, head(title)),
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

const parseOrcidWork = (work: IOrcidWork) => {
  const pubdate = `${defaultTo('????', view(orcidLenses.publicationDateYear, work))}/${defaultTo(
    '??',
    view(orcidLenses.publicationDateMonth, work),
  )}`;
  return pipe(
    assoc('title', view(orcidLenses.title, work)),
    assoc('source', view(orcidLenses.sourceName, work)),
    assoc('identifier', view(orcidLenses.identifier, work)),
    assoc('ids', view(orcidLenses.externalId)),
    assoc('pubdate', pubdate),
  )({} as IDocsEntity);
};
