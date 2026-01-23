/**
 * ADS/SciX field enumeration constraints for query validation.
 *
 * TypeScript port of the Python field_constraints module.
 * Used to validate model-generated queries at inference time.
 *
 * References:
 *   - ADS Search Syntax: https://ui.adsabs.harvard.edu/help/search/search-syntax
 *   - ADS Solr Schema: https://github.com/adsabs/montysolr
 *   - ADS Bibgroups: https://ui.adsabs.harvard.edu/help/data_faq/Bibgroups
 */

// Document types indexed by ADS
export const DOCTYPES = new Set([
  'abstract',
  'article',
  'book',
  'bookreview',
  'catalog',
  'circular',
  'editorial',
  'eprint',
  'erratum',
  'inbook',
  'inproceedings',
  'mastersthesis',
  'misc',
  'newsletter',
  'obituary',
  'phdthesis',
  'pressrelease',
  'proceedings',
  'proposal',
  'software',
  'talk',
  'techreport',
]);

// Properties for filtering records
export const PROPERTIES = new Set([
  'ads_openaccess',
  'author_openaccess',
  'eprint_openaccess',
  'pub_openaccess',
  'openaccess',
  'article',
  'nonarticle',
  'refereed',
  'notrefereed',
  'eprint',
  'inproceedings',
  'software',
  'catalog',
  'associated',
  'data',
  'esource',
  'inspire',
  'library_catalog',
  'presentation',
  'toc',
  'ocr_abstract',
]);

// Database collections in ADS
export const DATABASES = new Set(['astronomy', 'physics', 'general']);

// Bibliographic groups curated by institutions/observatories
export const BIBGROUPS = new Set([
  'HST',
  'JWST',
  'Spitzer',
  'Chandra',
  'XMM',
  'GALEX',
  'Kepler',
  'K2',
  'TESS',
  'FUSE',
  'IUE',
  'EUVE',
  'Copernicus',
  'IRAS',
  'WISE',
  'NEOWISE',
  'Fermi',
  'Swift',
  'RXTE',
  'NuSTAR',
  'SOHO',
  'STEREO',
  'SDO',
  'ESO/Telescopes',
  'CFHT',
  'Gemini',
  'Keck',
  'VLT',
  'Subaru',
  'NOAO',
  'NOIRLab',
  'CTIO',
  'KPNO',
  'Pan-STARRS',
  'SDSS',
  '2MASS',
  'UKIRT',
  'ALMA',
  'JCMT',
  'APEX',
  'ARECIBO',
  'VLA',
  'VLBA',
  'GBT',
  'LOFAR',
  'MeerKAT',
  'SKA',
  'Gaia',
  'Hipparcos',
  'CfA',
  'NASA PubSpace',
  'LISA',
  'LIGO',
]);

// Electronic source types
export const ESOURCES = new Set([
  'PUB_PDF',
  'PUB_HTML',
  'EPRINT_PDF',
  'EPRINT_HTML',
  'AUTHOR_PDF',
  'AUTHOR_HTML',
  'ADS_PDF',
  'ADS_SCAN',
]);

// Data archive sources
export const DATA_SOURCES = new Set([
  'ARI',
  'BICEP2',
  'Chandra',
  'CXO',
  'ESA',
  'ESO',
  'GCPD',
  'GTC',
  'HEASARC',
  'Herschel',
  'INES',
  'IRSA',
  'ISO',
  'KOA',
  'MAST',
  'NED',
  'NExScI',
  'NOAO',
  'PDS',
  'SIMBAD',
  'Spitzer',
  'TNS',
  'VizieR',
  'XMM',
]);

// Combined dict for easier validation lookup
export const FIELD_ENUMS: Record<string, Set<string>> = {
  doctype: DOCTYPES,
  database: DATABASES,
  property: PROPERTIES,
  bibgroup: BIBGROUPS,
  esources: ESOURCES,
  data: DATA_SOURCES,
};

/**
 * Get the set of valid values for a constrained field.
 */
export function getValidValues(field: string): Set<string> | undefined {
  return FIELD_ENUMS[field.toLowerCase()];
}

/**
 * Check if a value is valid for a given constrained field.
 */
export function isValidValue(field: string, value: string): boolean {
  const validValues = getValidValues(field);
  if (!validValues) {
    return true; // No constraints for this field
  }
  const valueLower = value.toLowerCase();
  for (const valid of validValues) {
    if (valid.toLowerCase() === valueLower) {
      return true;
    }
  }
  return false;
}

/**
 * Suggest possible corrections for an invalid field value.
 */
export function suggestCorrection(field: string, invalidValue: string): string[] {
  const validValues = getValidValues(field);
  if (!validValues) {
    return [];
  }

  const invalidLower = invalidValue.toLowerCase();
  const suggestions: Array<[number, string]> = [];

  for (const valid of validValues) {
    const validLower = valid.toLowerCase();
    // Exact prefix match
    if (validLower.startsWith(invalidLower) || invalidLower.startsWith(validLower)) {
      suggestions.push([0, valid]);
    }
    // Substring match
    else if (invalidLower.includes(validLower) || validLower.includes(invalidLower)) {
      suggestions.push([1, valid]);
    }
    // Common prefix
    else if (invalidLower.length > 2 && validLower.length > 2) {
      let common = 0;
      const minLen = Math.min(invalidLower.length, validLower.length);
      for (let i = 0; i < minLen; i++) {
        if (invalidLower[i] === validLower[i]) {
          common++;
        } else {
          break;
        }
      }
      if (common >= 3) {
        suggestions.push([2, valid]);
      }
    }
  }

  // Sort by match quality and return top 3
  suggestions.sort((a, b) => a[0] - b[0]);
  return suggestions.slice(0, 3).map((s) => s[1]);
}

/**
 * Error for an invalid field value.
 */
export interface FieldConstraintError {
  field: string;
  value: string;
  suggestions: string[];
}

/**
 * Result of field constraint validation.
 */
export interface ConstraintValidationResult {
  valid: boolean;
  errors: FieldConstraintError[];
  corrections: FieldCorrection[];
}

/**
 * A correction made to the query.
 */
export interface FieldCorrection {
  field: string;
  originalValue: string;
  action: 'removed' | 'corrected';
  correctedValue?: string;
}

/**
 * Validate that field values in a query match allowed enumerations.
 */
export function validateFieldConstraints(query: string): ConstraintValidationResult {
  const errors: FieldConstraintError[] = [];
  const constrainedFields = ['doctype', 'database', 'property', 'bibgroup'];

  for (const fieldName of constrainedFields) {
    const validValues = FIELD_ENUMS[fieldName];
    if (!validValues) {
      continue;
    }

    // Match field:value, field:"value", field:(val1 OR val2)
    const pattern = new RegExp(`\\b${fieldName}:\\s*(?:"([^"]+)"|(\\([^)]+\\))|([^\\s()]+))`, 'gi');

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(query)) !== null) {
      if (match[1]) {
        // Quoted value
        const value = match[1];
        if (!isValidValue(fieldName, value)) {
          errors.push({
            field: fieldName,
            value,
            suggestions: suggestCorrection(fieldName, value),
          });
        }
      } else if (match[2]) {
        // Parenthesized group (OR list)
        const inner = match[2].slice(1, -1); // Remove parens
        const values = inner.split(/\s+OR\s+/i).map((v) => v.trim().replace(/^"|"$/g, ''));
        for (const v of values) {
          if (v && !isValidValue(fieldName, v)) {
            errors.push({
              field: fieldName,
              value: v,
              suggestions: suggestCorrection(fieldName, v),
            });
          }
        }
      } else if (match[3]) {
        // Unquoted value
        const value = match[3];
        if (!isValidValue(fieldName, value)) {
          errors.push({
            field: fieldName,
            value,
            suggestions: suggestCorrection(fieldName, value),
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    corrections: [],
  };
}

/**
 * Fix malformed operator syntax like 'citationsauthor:' -> 'citations(author:...)'
 *
 * Model sometimes concatenates operator name directly with field name instead of
 * using parentheses. This reconstructs the correct syntax.
 *
 * Also fixes malformed field concatenations like 'abs:referencesabs:abs:' -> 'abs:'
 */
function fixMalformedOperators(query: string): string {
  const OPERATORS = ['citations', 'references', 'trending', 'useful', 'similar', 'reviews', 'topn'];
  const FIELDS = [
    'author',
    'abs',
    'title',
    'pubdate',
    'bibstem',
    'object',
    'keyword',
    'doctype',
    'property',
    'database',
    'bibgroup',
    'aff',
    'full',
    'identifier',
  ];

  // Fix 1: operator directly followed by field name
  // Match: citations + author: -> citations(author:
  for (const op of OPERATORS) {
    const pattern = new RegExp(`\\b${op}((?:${FIELDS.join('|')}):)`, 'gi');
    query = query.replace(pattern, (match, fieldPart: string) => {
      console.warn(`Fixed malformed operator: ${op}${fieldPart} -> ${op}(${fieldPart}`);
      return `${op}(${fieldPart}`;
    });
  }

  // Fix 2: Remove garbage between field name and value
  // Match patterns like: abs:referencesabs:abs: or abs:garbage"value"
  // Replace with: abs:"value" or abs:value
  for (const field of FIELDS) {
    // Pattern 1: field: followed by non-quote junk until we hit a quote or another field:
    // Examples: abs:referencesabs:abs: or title:garbagefield:"phrase"
    const junkPattern = new RegExp(
      `${field}:[\\w]*(?:${OPERATORS.join('|')}|${FIELDS.join('|')})[\\w:]*(["\\\(]|\\s)`,
      'gi',
    );
    query = query.replace(junkPattern, `${field}:$1`);

    // Pattern 2: Multiple consecutive field declarations: abs:abs:abs: -> abs:
    const repeatPattern = new RegExp(`(${field}:)(?:${field}:)+`, 'gi');
    query = query.replace(repeatPattern, `$1`);
  }

  // Fix 3: Balance parentheses
  const openCount = (query.match(/\(/g) || []).length;
  let closeCount = (query.match(/\)/g) || []).length;

  while (openCount > closeCount) {
    query = query + ')';
    closeCount++;
  }

  return query;
}

/**
 * Clean up model-generated query by removing invalid field values.
 *
 * Removes field:value pairs where the value is not in FIELD_ENUMS.
 * Returns the cleaned query and a list of corrections made.
 */
export function constrainQueryOutput(query: string): { query: string; corrections: FieldCorrection[] } {
  if (!query || !query.trim()) {
    return { query: '', corrections: [] };
  }

  let result = query.trim();
  const corrections: FieldCorrection[] = [];

  // Fix malformed operators before processing fields
  // (e.g., citationsauthor: -> citations(author:...))
  result = fixMalformedOperators(result);

  // Process each constrained field
  for (const [fieldName, validValues] of Object.entries(FIELD_ENUMS)) {
    const validLower = new Set([...validValues].map((v) => v.toLowerCase()));
    result = filterField(result, fieldName, validLower, corrections);
  }

  // Clean up artifacts from removal
  result = cleanupQuery(result);

  return { query: result, corrections };
}

function filterField(
  query: string,
  fieldName: string,
  validLower: Set<string>,
  corrections: FieldCorrection[],
): string {
  // Pattern for OR list: field:(val1 OR val2)
  const orPattern = new RegExp(`\\b${fieldName}:\\s*\\(([^)]+)\\)`, 'gi');

  query = query.replace(orPattern, (match, inner: string) => {
    const parts = inner.split(/\s+OR\s+/i);
    const validParts: string[] = [];
    for (const part of parts) {
      const clean = part.trim().replace(/^"|"$/g, '');
      if (validLower.has(clean.toLowerCase())) {
        validParts.push(part.trim());
      } else {
        corrections.push({
          field: fieldName,
          originalValue: clean,
          action: 'removed',
        });
      }
    }

    if (validParts.length === 0) {
      return '';
    } else if (validParts.length === 1) {
      return `${fieldName}:${validParts[0]}`;
    } else {
      return `${fieldName}:(${validParts.join(' OR ')})`;
    }
  });

  // Pattern for quoted value: field:"value"
  const quotedPattern = new RegExp(`\\b${fieldName}:\\s*"([^"]*)"`, 'gi');

  query = query.replace(quotedPattern, (match, value: string) => {
    if (validLower.has(value.toLowerCase())) {
      return match;
    } else {
      corrections.push({
        field: fieldName,
        originalValue: value,
        action: 'removed',
      });
      return '';
    }
  });

  // Pattern for unquoted value: field:value
  const unquotedPattern = new RegExp(`\\b${fieldName}:([^\\s()"]+)`, 'gi');

  query = query.replace(unquotedPattern, (match, value: string) => {
    if (validLower.has(value.toLowerCase())) {
      return match;
    } else {
      corrections.push({
        field: fieldName,
        originalValue: value,
        action: 'removed',
      });
      return '';
    }
  });

  return query;
}

function cleanupQuery(query: string): string {
  // Remove empty parentheses
  query = query.replace(/\(\s*\)/g, '');

  // Remove leading boolean operators
  query = query.replace(/^\s*(AND|OR|NOT)\s+/i, '');

  // Remove trailing boolean operators
  query = query.replace(/\s+(AND|OR|NOT)\s*$/i, '');

  // Remove double boolean operators
  let prev = '';
  while (prev !== query) {
    prev = query;
    query = query.replace(/\b(AND|OR|NOT)\s+(AND|OR)\b/gi, '$2');
  }

  // Handle orphan operators
  query = query.replace(/^\s*(AND|OR)\s+/i, '');
  query = query.replace(/\s+(AND|OR|NOT)\s*$/i, '');

  // Collapse multiple spaces
  query = query.replace(/\s+/g, ' ');

  // Remove parentheses with single term, but preserve operator function calls
  // e.g., "(article)" -> "article" but "citations(author:...)" stays intact
  const OPERATORS = ['citations', 'references', 'trending', 'useful', 'similar', 'reviews', 'topn'];
  query = query.replace(/\(([^()]+)\)/g, (match, inner, offset) => {
    const innerTrimmed = inner.trim();

    // Check if this is an operator function call by looking at what precedes the paren
    const prefix = query.slice(0, offset);
    const isOperatorCall = OPERATORS.some((op) => prefix.toLowerCase().endsWith(op));
    if (isOperatorCall) {
      return match; // Preserve operator parentheses
    }

    // Only strip if no boolean operators inside
    if (!/\b(AND|OR|NOT)\b/i.test(innerTrimmed)) {
      return innerTrimmed;
    }
    return match;
  });

  // Fix unbalanced parentheses
  let openCount = (query.match(/\(/g) || []).length;
  let closeCount = (query.match(/\)/g) || []).length;
  while (openCount !== closeCount) {
    if (openCount > closeCount) {
      const idx = query.lastIndexOf('(');
      query = query.slice(0, idx) + query.slice(idx + 1);
      openCount--;
    } else {
      const idx = query.indexOf(')');
      query = query.slice(0, idx) + query.slice(idx + 1);
      closeCount--;
    }
  }

  return query.trim();
}
