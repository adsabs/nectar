import type { PropertyValue } from 'schema-dts';

/**
 * Minimal structure containing only identifiers we parse.
 */
export type IdentifierOnlyDoc = {
  identifier?: Array<string | number>;
};

/**
 * Result of identifier parsing with schema.org PropertyValues and sameAs links.
 */
export type IdentifierResult = {
  identifiers: PropertyValue[];
  sameAs: string[];
};

const re = {
  doi: /^10\.\d{4,9}\/\S+$/i,
  arxivTag: /^arXiv:/i,
  pmidTag: /^PMID:\s*/i,
  pmcidTag: /^PMCID:\s*/i,
  hdlMaybe: /^(?:hdl:)?\d+\/.+/i,
  halTag: /^hal[-:]/i,
  openalex: /^W\d+$/i,
  wikidata: /^Q\d+$/i,
  s2Tag: /^S2PaperId:?/i,
};

// Heuristic ADS bibcode detector (safe & lenient)
// Typical bibcode length is 19; starts with 4-digit year; exclude other known formats.
function looksLikeBibcode(s: string): boolean {
  if (s.length !== 19) {
    return false;
  }
  if (!/^\d{4}/.test(s)) {
    return false;
  }
  return !(re.doi.test(s) || re.arxivTag.test(s) || re.hdlMaybe.test(s));
}

function add(arr: PropertyValue[], propertyID: string, value?: string | number | null) {
  const v = value?.toString().trim();
  if (!v) {
    return;
  }
  arr.push({ '@type': 'PropertyValue', propertyID, value: v });
}

function normalizeHandle(v: string) {
  return v.replace(/^hdl:/i, '').trim();
}

function dedupe(pvs: PropertyValue[]) {
  const map = new Map<string, PropertyValue>();
  for (const pv of pvs) {
    const key = `${pv.propertyID}::${pv.value}`;
    if (!map.has(key)) {
      map.set(key, pv);
    }
  }
  return Array.from(map.values());
}

function buildSameAs(pvs: PropertyValue[]) {
  const out = new Set<string>();
  for (const { propertyID, value } of pvs) {
    const v = String(value);
    switch (propertyID) {
      case 'DOI':
        out.add(`https://doi.org/${v}`);
        break;
      case 'arXiv':
        out.add(`https://arxiv.org/abs/${v}`);
        break;
      case 'ADS Bibcode':
        out.add(`https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(v)}/abstract`);
        break;
      case 'PMID':
        out.add(`https://pubmed.ncbi.nlm.nih.gov/${v}/`);
        break;
      case 'PMCID':
        out.add(`https://www.ncbi.nlm.nih.gov/pmc/articles/${v}/`);
        break;
      case 'Handle':
        out.add(`https://hdl.handle.net/${v}`);
        break;
      case 'HAL':
        out.add(`https://hal.science/${v}`);
        break;
      case 'OpenAlex':
        out.add(`https://openalex.org/${v}`);
        break;
      case 'S2PaperId':
        out.add(`https://www.semanticscholar.org/paper/${v}`);
        break;
      case 'Wikidata':
        out.add(`https://www.wikidata.org/wiki/${v}`);
        break;
      case 'Zenodo':
        out.add(`https://zenodo.org/records/${v}`);
        break;
      default:
        break;
    }
  }
  return Array.from(out);
}

/**
 * Parse a heterogeneous identifier list into typed properties and canonical links.
 */
export function collectIdentifiersFromArray(doc: IdentifierOnlyDoc): IdentifierResult {
  const pvs: PropertyValue[] = [];
  for (const raw of doc.identifier ?? []) {
    const s = String(raw).trim();
    if (!s) {
      continue;
    }

    if (re.arxivTag.test(s)) {
      add(pvs, 'arXiv', s.replace(re.arxivTag, '').trim());
    } else if (re.pmidTag.test(s)) {
      add(pvs, 'PMID', s.replace(re.pmidTag, '').trim());
    } else if (re.pmcidTag.test(s)) {
      add(pvs, 'PMCID', s.replace(re.pmcidTag, '').trim());
    } else if (re.doi.test(s)) {
      add(pvs, 'DOI', s);
    } else if (re.hdlMaybe.test(s)) {
      add(pvs, 'Handle', normalizeHandle(s));
    } else if (re.halTag.test(s)) {
      add(pvs, 'HAL', s.replace(re.halTag, '').trim());
    } else if (re.openalex.test(s)) {
      add(pvs, 'OpenAlex', s.toUpperCase());
    } else if (re.wikidata.test(s)) {
      add(pvs, 'Wikidata', s.toUpperCase());
    } else if (re.s2Tag.test(s)) {
      add(pvs, 'S2PaperId', s.replace(re.s2Tag, '').trim());
    } else if (looksLikeBibcode(s)) {
      add(pvs, 'ADS Bibcode', s);
    } else {
      // Silently ignore unknown patterns
    }
  }

  const identifiers = dedupe(pvs);
  const sameAs = buildSameAs(identifiers);
  return { identifiers, sameAs };
}
