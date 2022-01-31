import { IDocsEntity } from '@api';
import { Esources } from '@api/lib/search/types';
import { compose, descend, is, map, prop, sortBy, sortWith } from 'ramda';
import { DEFAULT_ORDERING, GATEWAY_BASE_URL, LINK_TYPES } from './model';
import { getOpenUrl } from './openUrlGenerator';

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

export interface ILinkData {
  fullTextSources: IFullTextSource[];
  dataProducts: IDataProductSource[];
}

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
 * @returns {object} - the fulltext and data sources
 */
export const processLinkData = (doc: IDocsEntity, linkServer: string): ILinkData => {
  let countOpenUrls = 0;

  // reorder the full text sources based on our default ordering
  const sortByDefaultOrdering = sortBy<IFullTextSource>(({ name }) => {
    const rank = DEFAULT_ORDERING.indexOf(name as Esources);
    return rank > -1 ? rank : 9999;
  });

  const mapOverSources = map<Esources, IFullTextSource>((el): IFullTextSource => {
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
      };
    }

    const maybeOpenSources = [
      Esources.ADS_PDF,
      Esources.ADS_SCAN,
      Esources.AUTHOR_HTML,
      Esources.AUTHOR_PDF,
      Esources.EPRINT_HTML,
      Esources.EPRINT_PDF,
      Esources.PUB_HTML,
      Esources.PUB_PDF,
    ];

    const [prefix] = el.split('_');
    const open = maybeOpenSources.includes(el) && doc.property.includes(`${prefix}_OPENACCESS`);

    return {
      url: createGatewayUrl(doc.bibcode, el),
      open,
      shortName: (linkInfo && linkInfo.shortName) || el,
      name: (linkInfo && linkInfo.name) || el,
      type: (linkInfo && linkInfo.type) || 'HTML',
      description: linkInfo && linkInfo.description,
    };
  });

  const processEsources = compose(sortByDefaultOrdering, mapOverSources);
  const fullTextSources = processEsources(doc.esources);

  interface IEprintLink {
    type: string;
    url: string;
  }

  // if no arxiv link is present, check links_data as well to make sure
  const hasEprint = fullTextSources.some(({ name }) => name === LINK_TYPES.EPRINT_PDF.name);
  if (!hasEprint && Array.isArray(doc.links_data)) {
    doc.links_data.forEach((linkData) => {
      const link = JSON.parse(linkData) as IEprintLink;
      if (/preprint/i.test(link.type)) {
        const info = LINK_TYPES.EPRINT_PDF;
        fullTextSources.push({
          url: link.url,
          open: true,
          shortName: info && info.shortName ? info.shortName : link.type,
          name: info && info.name ? info.name : link.type,
          type: info && info.type ? info.type : 'HTML',
          description: info && info.description ? info.description : undefined,
        });
      }
    });
  }

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

  const processDataProducts = compose(sortWith([descend(prop('count'))]), mapOverDataProducts);

  return {
    fullTextSources,
    dataProducts: doc.data ? processDataProducts(doc.data) : [],
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

const enc = function (str) {
  return encodeURIComponent(str);
};
