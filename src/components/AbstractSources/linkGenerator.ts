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
export const processLinkData = (doc: IDocsEntity, linkServer: string) => {
  let countOpenUrls = 0;

  // reorder the full text sources based on our default ordering
  const sortByDefaultOrdering = sortBy<IFullTextSource>(({ name }) => {
    const rank = DEFAULT_ORDERING.indexOf(name as Esources);
    return rank > -1 ? rank : 9999;
  });

  const mapOverSources = map<Esources, IFullTextSource>(
    (el): IFullTextSource => {
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
    },
  );

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

  const mapOverDataProducts = map(
    (product: string): IDataProductSource => {
      const [source, count = '1'] = product.split(':');
      const linkInfo = LINK_TYPES[source as Esources];

      return {
        url: createGatewayUrl(doc.bibcode, source),
        count,
        name: linkInfo ? linkInfo.shortName : source,
        description: linkInfo ? linkInfo.description : source,
      };
    },
  );

  const processDataProducts = compose(sortWith([descend(prop('count'))]), mapOverDataProducts);

  return {
    fullTextSources,
    dataProducts: doc.data ? processDataProducts(doc.data) : [],
  };
};

// doc.data.forEach((product) => {});

// // const createGatewayUrl = this._createGatewayUrl;
// // let fullTextSources = [];
// // let dataProducts = [];
// // let countOpenUrls = 0;
// // const property = doc.property;

// // check the esources property
// _.forEach(doc.esources, function (el, ids, sources) {
//   const parts = el.split('_');
//   const linkInfo = LINK_TYPES[el];
//   const linkServer = doc.link_server;
//   const identifier = doc.doi || doc.issn || doc.isbn;

//   // Create an OpenURL
//   // Only create an openURL if the following is true:
//   //   - The article HAS an Identifier (doi, issn, isbn)
//   //   - The user is authenticated
//   //   - the user HAS a library link server
//   if (identifier && linkServer && countOpenUrls < 1) {
//     fullTextSources.push({
//       url: getOpenUrl({ metadata: doc, linkServer }),
//       openUrl: true,
//       ...LINK_TYPES.INSTITUTION,
//     });
//     countOpenUrls += 1;
//   }

//   if (parts.length > 1) {
//     fullTextSources.push({
//       url: createGatewayUrl(doc.bibcode, el),
//       open: property.includes(`${parts[0]}_OPENACCESS`),
//       shortName: (linkInfo && linkInfo.shortName) || el,
//       name: (linkInfo && linkInfo.name) || el,
//       type: (linkInfo && linkInfo.type) || 'HTML',
//       description: linkInfo && linkInfo.description,
//     });

//     // if entry cannot be split, then it will not be open access
//   } else {
//     fullTextSources.push({
//       url: createGatewayUrl(doc.bibcode, el),
//       open: false,
//       shortName: (linkInfo && linkInfo.shortName) || el,
//       name: (linkInfo && linkInfo.name) || el,
//       type: (linkInfo && linkInfo.type) || 'HTML',
//       description: linkInfo && linkInfo.description,
//     });
//   }
// });

// if no arxiv link is present, check links_data as well to make sure
// const hasEprint = fullTextSources.some(({ name }) => name === LINK_TYPES.EPRINT_PDF.name);
// if (!hasEprint && Array.isArray(doc.links_data)) {
//   doc.links_data.forEach((linkData) => {
//     const link = JSON.parse(linkData);
//     if (/preprint/i.test(link.type)) {
//       const info = LINK_TYPES.EPRINT_PDF;
//       fullTextSources.push({
//         url: link.url,
//         open: true,
//         shortName: (info && info.shortName) || link.type,
//         name: (info && info.name) || link.type,
//         type: (info && info.type) || 'HTML',
//         description: info && info.description,
//       });
//     }
//   });
// }

// reorder the full text sources based on our default ordering
// fullTextSources = _.sortBy(fullTextSources, function (source) {
//   const rank = DEFAULT_ORDERING.indexOf(source.name);
//   return rank > -1 ? rank : 9999;
// });

// // check the data property
// _.forEach(doc.data, function (product) {
//   const parts = product.split(':');
//   const linkInfo = LINK_TYPES[parts[0]];

//   // are there any without a count? just make them 1
//   if (parts.length > 1) {
//     dataProducts.push({
//       url: createGatewayUrl(doc.bibcode, parts[0]),
//       count: parts[1],
//       name: linkInfo ? linkInfo.shortName : parts[0],
//       description: linkInfo ? linkInfo.description : parts[0],
//     });
//   } else {
//     dataProducts.push({
//       url: createGatewayUrl(doc.bibcode, product),
//       count: '1',
//       name: linkInfo ? linkInfo.shortName : product,
//       description: linkInfo ? linkInfo.description : product,
//     });
//   }
// });

// sort the data products by descending by count
// dataProducts = _.sortBy(dataProducts, 'count').reverse();

//   return {
//     fullTextSources: fullTextSources,
//     dataProducts: dataProducts,
//   };
// };

// /**
//  * Parse a data object to pull out the references/citations and table of contents
//  * it will also return a copy of the data object with a links property added
//  * @param {object} _data - the data object to parse
//  * @returns {object} - copy of the data object with links prop added
//  */
// const _parseLinksDataForModel = function (_data, linksData) {
//   let links = { list: [], data: [], text: [] };
//   const data = _.extend({}, _data, { links: links });

//   // map linksData to links object
//   if (_.isPlainObject(linksData)) {
//     links = _.assign(links, {
//       data: links.data.concat(linksData.dataProducts || []),
//       text: links.text.concat(linksData.fullTextSources || []),
//     });
//   }

//   if (_.isPlainObject(data)) {
//     // check for the citations property
//     if (_.isPlainObject(data['[citations]']) && _.isString(data.bibcode)) {
//       const citations = data['[citations]'];

//       // push it onto the links if the citation count is higher than 0
//       if (_.isNumber(citations.num_citations) && citations.num_citations > 0) {
//         links.list.push({
//           letter: 'C',
//           name: 'Citations (' + citations.num_citations + ')',
//           url: '#abs/' + enc(data.bibcode) + '/citations',
//         });
//       }

//       // push onto the links if the reference count is higher than 0
//       if (_.isNumber(citations.num_references) && citations.num_references > 0) {
//         links.list.push({
//           letter: 'R',
//           name: 'References (' + citations.num_references + ')',
//           url: '#abs/' + enc(data.bibcode) + '/references',
//         });
//       }
//     }

//     // check that we have property and whether table of contents is found
//     if (_.isArray(data.property) && _.isString(data.bibcode)) {
//       if (_.contains(data.property, 'TOC')) {
//         links.list.push({
//           letter: 'T',
//           name: 'Table of Contents',
//           url: '#abs/' + enc(data.bibcode) + '/toc',
//         });
//       }
//     }
//   } else {
//     throw new Error('data must be a plain object');
//   }

//   return data;
// };

/**
 * Takes in a type and an identifier and will generate a link
 * @param {string} bibcode - the bibcode
 * @param {string} type - the type of identifier
 * @param {string|array} identifier - the identifier to use to build the url
 * @returns {string}
 */
const createUrlByType = function (bibcode: string, type: string, identifier: string | string[]) {
  const id = Array.isArray(identifier) ? identifier[0] : identifier;

  if (typeof bibcode === 'string' && typeof type === 'string' && typeof identifier === 'string') {
    return GATEWAY_BASE_URL + bibcode + '/' + type + ':' + id;
  }
  return '';
};

const enc = function (str) {
  return encodeURIComponent(str);
};
