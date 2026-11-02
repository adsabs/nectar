const ESOURCES = ['EPRINT_HTML', 'EPRINT_PDF', 'PUB_HTML', 'PUB_PDF', 'ADS_PDF', 'ADS_SCAN'];
const PROPERTY = ['ARTICLE', 'DATA', 'EPRINT_OPENACCESS', 'ESOURCE', 'OPENACCESS', 'REFEREED'];
const DATA = ['ESA:1', 'MAST:1', 'NED:21'];

const pad = (index, width) => String(index).padStart(width, '0');

function generateSearchDocs(count, start) {
  const offset = Number.isInteger(start) ? start : 0;
  return Array.from({ length: count }, (_, i) => {
    const index = offset + i + 1;
    const bibcode = `2024Test${pad(index, 4)}.${pad(index, 4)}X`;
    return {
      id: String(1000000 + index),
      bibcode,
      title: [`Synthetic result ${index}: a study of the ${index}th cataclysmic variable`],
      author: Array.from({ length: 6 }, (_, a) => `Author${index}, ${String.fromCharCode(65 + a)}.`),
      author_count: 6,
      pubdate: '2024-06-00',
      pub: `Journal of Synthetic Astrophysics, Volume ${index}, Series B, Extended Edition`,
      bibstem: ['JSynA'],
      citation_count: index,
      citation_count_norm: index / 10,
      reference_count: index + 1,
      esources: ESOURCES,
      property: PROPERTY,
      data: DATA,
      identifier: [bibcode, `arXiv:2406.${pad(index, 5)}`],
      doi: [`10.1000/synthetic.${index}`],
      volume: String(index),
      page: [String(index * 10)],
      abstract: `Synthetic abstract for result ${index}. It exists so the result list does not issue a separate abstracts request.`,
    };
  });
}

const TOTAL_SYNTHETIC_RESULTS = 10000;

function buildSearchResponse(count, start) {
  const offset = Number.isInteger(start) ? start : 0;
  const available = Math.max(0, Math.min(count, TOTAL_SYNTHETIC_RESULTS - offset));
  return {
    responseHeader: { status: 0, QTime: 1, params: { rows: String(count), start: String(offset) } },
    response: {
      numFound: TOTAL_SYNTHETIC_RESULTS,
      start: offset,
      docs: generateSearchDocs(available, offset),
    },
  };
}

const EMPTY_SEARCH_RESPONSE = {
  responseHeader: { status: 0, QTime: 0, params: {} },
  response: { numFound: 0, start: 0, docs: [] },
};

module.exports = {
  generateSearchDocs,
  buildSearchResponse,
  EMPTY_SEARCH_RESPONSE,
  TOTAL_SYNTHETIC_RESULTS,
};
