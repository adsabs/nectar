import { compose, descend, is, map, pipe, prop, sort } from 'ramda';
import { DEFAULT_ORDERING, GATEWAY_BASE_URL, LINK_TYPES, MAYBE_OPEN_SOURCES } from './model';
import { getOpenUrl } from './openUrlGenerator';
import { isNilOrEmpty, isNonEmptyString } from 'ramda-adjunct';
import { IDataProductSource, IFullTextSource, ProcessLinkDataReturns } from '@/components/AbstractSources/types';
import { Esources, IDocsEntity } from '@/api/search/types';

/**
 * Create the resolver url
 * @param {string} bibcode - the bibcode
 * @param {string} target - the source target (i.e. PUB_HTML)
 * @returns {string} - the new url
 */
export const createGatewayUrl = (bibcode: string, target: string): string => {
  if (is(String, bibcode) && is(String, target)) {
    return `${GATEWAY_BASE_URL + encodeURIComponent(bibcode)}/${target}`;
  }
  return '';
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
  if (isNilOrEmpty(doc)) {
    return { fullTextSources: [], dataProducts: [] };
  }

  /**
   * Create an OpenURL (only one) if the following is true:
   *   - The article HAS an Identifier (doi, issn, isbn)
   *   - The user is authenticated (linkServer is present)
   */
  const maybeCreateInstitutionURL = () => {
    const identifier = doc.doi || doc.issn || doc.isbn;
    if (identifier && isNonEmptyString(linkServer)) {
      return {
        url: getOpenUrl({ metadata: doc, linkServer }),
        openUrl: true,
        ...LINK_TYPES.INSTITUTION,
        rawType: Esources.INSTITUTION,
      };
    }
  };

  /**
   * Map over the sources and create the full text sources
   * @param {string} el - the source
   * @returns {IFullTextSource} - the full text source
   */
  const mapOverSources = map<keyof typeof Esources, IFullTextSource>((el): IFullTextSource => {
    const linkInfo = LINK_TYPES[el];
    const [prefix] = el.split('_');
    const open = MAYBE_OPEN_SOURCES.includes(el) && !!doc.property?.includes(`${prefix}_OPENACCESS`);

    // if the source is a publisher, we need to update the name to be the publisher name
    if (el.startsWith('PUB_') && doc.publisher) {
      return {
        url: createGatewayUrl(doc?.bibcode, el),
        open,
        shortName: doc.publisher,

        // Adds the type to the name to match the way we display the default publisher entry
        // and to differentiate between the different publisher links
        name: `${doc.publisher} ${linkInfo?.type ?? 'HTML'}`,
        type: linkInfo?.type ?? 'HTML',
        description: linkInfo?.description ?? el,
        rawType: el,
      };
    }

    return {
      url: createGatewayUrl(doc?.bibcode, el),
      open,
      shortName: linkInfo?.shortName ?? el,
      name: linkInfo?.name ?? el,
      type: linkInfo?.type ?? 'HTML',
      description: linkInfo?.description ?? el,
      rawType: el,
    };
  });

  /**
   * Map over the data products and create the data products
   * @param {string} product - the product
   * @returns {IDataProductSource} - the data product
   */
  const mapOverDataProducts = map((product: string): IDataProductSource => {
    const [source, count = '1'] = product.split(':');
    const linkInfo = LINK_TYPES[source as Esources];

    return {
      url: createGatewayUrl(doc.bibcode, source),
      count,
      name: linkInfo?.shortName ?? source,
      description: linkInfo?.description ?? source,
    };
  });

  // map over the sources and sort them by our default ordering
  const processEsources = pipe(
    mapOverSources,

    // create the openurl and prepend it
    (sources) => {
      const openUrl = maybeCreateInstitutionURL();
      return openUrl ? [openUrl, ...sources] : sources;
    },
    sortByDefaultOrdering,
  );

  // map over the data products and sort them by count
  const processDataProducts = pipe(mapOverDataProducts, sort(descend(prop('count'))));

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
export const createUrlByType = function (bibcode: string, type: string, identifier: string): string {
  if (typeof bibcode === 'string' && typeof type === 'string' && typeof identifier === 'string') {
    return `${GATEWAY_BASE_URL + bibcode}/${type}:${identifier}`;
  }
  return '';
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
