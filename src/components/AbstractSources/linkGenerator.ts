import { Esources, IDocsEntity } from '@api';
import { compose, descend, is, map, prop, sort, sortWith } from 'ramda';
import { DEFAULT_ORDERING, GATEWAY_BASE_URL, LINK_TYPES, MAYBE_OPEN_SOURCES } from './model';
import { getOpenUrl } from './openUrlGenerator';
import { isNilOrEmpty } from 'ramda-adjunct';

/**
 * Create the resolver url
 * @param {string} bibcode - the bibcode
 * @param {string} target - the source target (i.e. PUB_HTML)
 * @returns {string} - the new url
 */
export const createGatewayUrl = (bibcode: string, target: string): string => {
  if (is(String, bibcode) && is(String, target)) {
    return GATEWAY_BASE_URL + enc(bibcode) + '/' + target;
  }
  return '';
};

export interface IFullTextSource {
  url: string;
  open?: boolean;
  shortName: string;
  name?: string;
  type?: string;
  description: string;
  openUrl?: boolean;
  rawType?: keyof typeof Esources;
}

export interface IDataProductSource {
  url: string;
  count: string;
  name: string;
  description: string;
}

export interface IRelatedWorks {
  url: string;
  name: string;
  description: string;
}

type ProcessLinkDataReturns = {
  fullTextSources: IFullTextSource[];
  dataProducts: IDataProductSource[];
};

/**
 * process the link data
 *
 * Proceeds in this manner:
 * 1. Check the property to find ESOURCE and DATA
 * 2. If there, find the property on the parent object
 * 3. Process by some rules
 *  3.1. If OPENACCESS property is present, then all esourses ending with _HTML are open
 *  3.2. If <field>_OPENACCESS property is present, then the corresponding esource field is open
 *  3.3. If electr field is present, check if a linkServer is provided among some other things
 *
 * @param {IDocsEntity} doc - the data object to process
 * @param {string} linkServer - the link server
 * @returns {ProcessLinkDataReturns} - the fulltext and data sources
 */
export const processLinkData = (doc: IDocsEntity, linkServer?: string): ProcessLinkDataReturns => {
  let countOpenUrls = 0;

  if (isNilOrEmpty(doc)) {
    return { fullTextSources: [], dataProducts: [] };
  }

  const mapOverSources = map<keyof typeof Esources, IFullTextSource>((el): IFullTextSource => {
    const linkInfo = LINK_TYPES[el];
    const identifier = doc.doi || doc.issn || doc.isbn;

    // Create an OpenURL
    // Only create an openURL if the following is true:
    //   - The article HAS an Identifier (doi, issn, isbn)
    //   - The user is authenticated
    //   - the user HAS a library link server
    if (identifier && linkServer && countOpenUrls < 1) {
      countOpenUrls += 1;
      return {
        url: getOpenUrl({ metadata: doc, linkServer }),
        openUrl: true,
        ...LINK_TYPES.INSTITUTION,
        rawType: Esources.INSTITUTION,
      };
    }

    const [prefix] = el.split('_');
    const open = MAYBE_OPEN_SOURCES.includes(el) && doc.property.includes(`${prefix}_OPENACCESS`);

    return {
      url: createGatewayUrl(doc.bibcode, el),
      open,
      shortName: linkInfo?.shortName || el,
      name: linkInfo?.name || el,
      type: linkInfo?.type || 'HTML',
      description: linkInfo?.description,
      rawType: el,
    };
  });

  interface IEprintLink {
    type: string;
    url: string;
  }

  // TODO: Verify this is still needed
  // // if no arxiv link is present, check links_data as well to make sure
  // const hasEprint = fullTextSources.some(({ name }) => name === LINK_TYPES.EPRINT_PDF.name);
  // if (!hasEprint && Array.isArray(doc.links_data)) {
  //   doc.links_data.forEach((linkData) => {
  //     const link = JSON.parse(linkData) as IEprintLink;
  //     if (/preprint/i.test(link.type)) {
  //       const info = LINK_TYPES.EPRINT_PDF;
  //       fullTextSources.push({
  //         url: link.url,
  //         open: true,
  //         shortName: info?.shortName ?? link.type,
  //         name: info?.name ?? link.type,
  //         type: info?.type ?? 'HTML',
  //         description: info?.description,
  //       });
  //     }
  //   });
  // }

  const mapOverDataProducts = map((product: string): IDataProductSource => {
    const [source, count = '1'] = product.split(':');
    const linkInfo = LINK_TYPES[source as Esources];

    return {
      url: createGatewayUrl(doc.bibcode, source),
      count,
      name: linkInfo ? linkInfo.shortName : source,
      description: linkInfo ? linkInfo.description : source,
    };
  });

  const processEsources = compose(sortByDefaultOrdering, mapOverSources);
  const processDataProducts = compose(sortWith([descend(prop('count'))]), mapOverDataProducts);

  return {
    fullTextSources: Array.isArray(doc.esources) ? processEsources(doc.esources) : [],
    dataProducts: Array.isArray(doc.data) ? processDataProducts(doc.data) : [],
  };
};

/**
 * Takes in a type and an identifier and will generate a link
 * @param {string} bibcode - the bibcode
 * @param {string} type - the type of identifier
 * @param {string|array} identifier - the identifier to use to build the url
 * @returns {string}
 */
export const createUrlByType = function (bibcode: string, type: string, identifier: string | string[]): string {
  const id = Array.isArray(identifier) ? identifier[0] : identifier;

  if (typeof bibcode === 'string' && typeof type === 'string' && typeof id === 'string') {
    return GATEWAY_BASE_URL + bibcode + '/' + type + ':' + id;
  }
  return '';
};

const enc = function (str: string) {
  return encodeURIComponent(str);
};

// reorder the full text sources based on our default ordering
const sortByDefaultOrdering = compose(
  // after the list is sorted, we have to push any sources that aren't in our default ordering to the end
  (list: IFullTextSource[]) => {
    const sourcesNotInDefaultOrdering = list.filter(({ rawType }) => !DEFAULT_ORDERING.includes(rawType));
    return [...list.filter(({ rawType }) => DEFAULT_ORDERING.includes(rawType)), ...sourcesNotInDefaultOrdering];
  },

  sort<IFullTextSource>((a, b) => {
    const aIndex = DEFAULT_ORDERING.indexOf(a.rawType);
    const bIndex = DEFAULT_ORDERING.indexOf(b.rawType);

    // If both elements are in the DEFAULT_ORDERING array, sort based on their indices
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // If only 'a' is in DEFAULT_ORDERING, move it before 'b'
    if (aIndex !== -1) {
      return -1;
    }

    // If only 'b' is in DEFAULT_ORDERING, move it before 'a'
    if (bIndex !== -1) {
      return 1;
    }

    // If both elements are not in DEFAULT_ORDERING, maintain their relative order
    return 0;
  }),
);
