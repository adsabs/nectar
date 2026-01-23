import type { NextApiRequest, NextApiResponse } from 'next';
import { constrainQueryOutput, validateFieldConstraints, type FieldCorrection } from '@/lib/field-constraints';

// Modal endpoints for NL search inference
// These should be set in environment variables for production deployments
// See: https://github.com/adsabs/nectar/blob/sj/fine-tune/FEATURE_BRANCH_SETUP.md
const PIPELINE_ENDPOINT = process.env.NL_SEARCH_PIPELINE_ENDPOINT || 'https://sjarmak--v1-chat-completions.modal.run';
const VLLM_ENDPOINT =
  process.env.NL_SEARCH_VLLM_ENDPOINT || 'https://sjarmak--nls-finetune-serve-vllm-serve.modal.run/v1/chat/completions';

const ADS_AUTOCOMPLETE_URL = 'https://api.adsabs.harvard.edu/v1/autocomplete';
const SIMBAD_TAP_URL = 'https://simbad.cds.unistra.fr/simbad/sim-tap/sync';
const AUTOCOMPLETE_TIMEOUT_MS = 200;
const SIMBAD_TIMEOUT_MS = 100;
const PIPELINE_TIMEOUT_MS = 2000; // Pipeline should respond in <500ms, 2s for safety

const SYSTEM_PROMPT = 'Convert natural language to ADS search query. Output ONLY the query, no explanation or JSON.';

/**
 * Pre-computed synonym table for common astronomy terms.
 * Each key maps to semantically related terms for query expansion.
 * Terms are lowercase for matching; original case preserved in expansion.
 */
const SYNONYM_TABLE: Record<string, string[]> = {
  // Stellar and compact objects
  'black hole': ['black hole', 'BH', 'singularity', 'event horizon'],
  'neutron star': ['neutron star', 'pulsar', 'magnetar', 'compact star'],
  'white dwarf': ['white dwarf', 'WD', 'degenerate star'],
  supernova: ['supernova', 'SN', 'stellar explosion', 'core collapse'],
  'type ia': ['type Ia', 'SNe Ia', 'thermonuclear supernova'],
  'gamma ray burst': ['gamma ray burst', 'GRB', 'gamma-ray burst'],
  quasar: ['quasar', 'QSO', 'AGN', 'active galactic nucleus'],

  // Planetary science
  'planet formation': ['planet formation', 'protoplanetary disk', 'planetesimal', 'accretion disk'],
  exoplanet: ['exoplanet', 'extrasolar planet', 'hot Jupiter', 'super Earth'],
  'hot jupiter': ['hot Jupiter', 'gas giant', 'close-in planet'],
  'protoplanetary disk': ['protoplanetary disk', 'circumstellar disk', 'PPD', 'T Tauri disk'],

  // Cosmology
  'dark matter': ['dark matter', 'DM', 'cold dark matter', 'CDM', 'WIMP'],
  'dark energy': ['dark energy', 'cosmological constant', 'lambda', 'accelerating universe'],
  'cosmic microwave background': ['cosmic microwave background', 'CMB', 'CMBR', 'microwave background'],
  'big bang': ['big bang', 'early universe', 'primordial', 'cosmological'],
  inflation: ['inflation', 'inflationary', 'slow roll', 'inflaton'],
  redshift: ['redshift', 'z=', 'cosmological redshift', 'doppler shift'],

  // Gravitational physics
  'gravitational waves': ['gravitational waves', 'GW', 'gravitational wave', 'LIGO', 'Virgo'],
  'gravitational lensing': ['gravitational lensing', 'weak lensing', 'strong lensing', 'microlensing'],

  // Galaxy evolution
  'galaxy formation': ['galaxy formation', 'galaxy evolution', 'hierarchical assembly', 'merger'],
  'star formation': ['star formation', 'SFR', 'starburst', 'stellar nursery', 'molecular cloud'],
  'interstellar medium': ['interstellar medium', 'ISM', 'gas and dust', 'diffuse gas'],
  agn: ['AGN', 'active galactic nucleus', 'Seyfert', 'quasar', 'LINER'],

  // Techniques and methods
  spectroscopy: ['spectroscopy', 'spectrum', 'spectral analysis', 'spectra'],
  photometry: ['photometry', 'photometric', 'magnitude', 'light curve'],
  astrometry: ['astrometry', 'proper motion', 'parallax', 'Gaia'],
  'radial velocity': ['radial velocity', 'RV', 'Doppler', 'spectroscopic'],

  // Machine learning in astronomy
  'machine learning': ['machine learning', 'deep learning', 'neural network', 'CNN', 'random forest'],
  'artificial intelligence': ['artificial intelligence', 'AI', 'machine learning', 'deep learning'],
};

// Simple in-memory cache for author autocomplete results (1 hour TTL)
const autocompleteCache = new Map<string, { suggestions: string[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Cache for SIMBAD object name resolution (1 hour TTL)
const objectNameCache = new Map<string, { aliases: string[]; timestamp: number }>();

/**
 * Common object name patterns for astronomical objects.
 * Matches: M31, NGC 224, IC 1613, UGC 12591, Messier 31, etc.
 */
const OBJECT_NAME_PATTERNS = [
  /\bM\s*\d+\b/gi, // Messier: M31, M 31
  /\bMessier\s*\d+\b/gi, // Messier 31
  /\bNGC\s*\d+[A-Z]?\b/gi, // NGC: NGC 224, NGC 1234A
  /\bIC\s*\d+\b/gi, // Index Catalogue: IC 1613
  /\bUGC\s*\d+\b/gi, // Uppsala General Catalogue
  /\bPGC\s*\d+\b/gi, // Principal Galaxies Catalogue
  /\b3C\s*\d+\b/gi, // Third Cambridge Catalogue (radio)
  /\bAbell\s*\d+\b/gi, // Abell clusters
  /\bCl\s*\d{4}[+-]\d{2,4}\b/gi, // Cluster designations
  /\bHD\s*\d+\b/gi, // Henry Draper catalog
  /\bHIP\s*\d+\b/gi, // Hipparcos catalog
  /\b2MASS\s*J\d+[+-]\d+\b/gi, // 2MASS sources
  /\bSDSS\s*J\d+\.\d+[+-]\d+\.\d+\b/gi, // SDSS sources
];

interface NLSearchRequest {
  query: string;
  expand?: boolean; // Enable/disable synonym expansion (default: true)
  resolveObjects?: boolean; // Enable/disable object name resolution via SIMBAD (default: true)
  usePipeline?: boolean; // Use hybrid NER pipeline (default: true)
}

// Pipeline result types (from Python pipeline.py)
interface PipelineDebugInfo {
  ner_time_ms: number;
  retrieval_time_ms: number;
  assembly_time_ms: number;
  total_time_ms: number;
  constraint_corrections: string[];
  fallback_reason: string | null;
  raw_extracted: Record<string, unknown> | null;
}

interface PipelineRetrievedExample {
  nl_query: string;
  ads_query: string;
  features: Record<string, unknown>;
  score: number;
}

interface PipelineResult {
  query: string;
  intent: Record<string, unknown>;
  retrieved_examples: PipelineRetrievedExample[];
  debug_info: PipelineDebugInfo;
  success: boolean;
  error: string | null;
}

interface PipelineChatResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  pipeline_result?: PipelineResult;
  error?: string;
  fallback?: boolean;
}

interface QuerySuggestion {
  query: string;
  description: string;
}

interface ConstraintViolation {
  field: string;
  value: string;
  suggestions: string[];
}

interface NLSearchResponse {
  query: string;
  queries?: QuerySuggestion[];
  error?: string;
  constraintViolations?: ConstraintViolation[];
  corrections?: FieldCorrection[];
  rawQuery?: string; // Original model output before constraint filtering
  // Pipeline debug info (when using hybrid pipeline)
  pipelineDebug?: {
    intent: Record<string, unknown>;
    retrievedExamples: PipelineRetrievedExample[];
    timing: {
      nerMs: number;
      retrievalMs: number;
      assemblyMs: number;
      totalMs: number;
    };
    constraintCorrections: string[];
    fallbackReason: string | null;
    usedPipeline: boolean;
  };
}

/**
 * Generates 3-5 alternative query variations from a single base query.
 * Creates variations like: exact phrase, AND terms, title variant, with synonyms.
 */
function generateQueryVariations(baseQuery: string): QuerySuggestion[] {
  const suggestions: QuerySuggestion[] = [];

  // Primary query - the model's best guess
  suggestions.push({
    query: baseQuery,
    description: 'Best match',
  });

  // Extract quoted phrases and fields from the query
  const absMatches = baseQuery.match(/abs:["']?([^"'\s]+(?:\s+[^"'\s]+)*|"[^"]+")["']?/gi) || [];
  const authorMatches = baseQuery.match(/author:["^]*["']?([^"'\s]+)["']?/gi) || [];
  const pubdateMatches = baseQuery.match(/pubdate:\[[^\]]+\]/gi) || [];
  const objectMatches = baseQuery.match(/object:["']?[^"'\s]+["']?/gi) || [];

  // Extract terms from abs: fields for variations
  const absTerms: string[] = [];
  for (const match of absMatches) {
    const termMatch = match.match(/abs:["']?([^"']+)["']?/i);
    if (termMatch) {
      absTerms.push(termMatch[1].replace(/^"|"$/g, ''));
    }
  }

  // Variation 2: If query has quoted phrase, try AND terms version
  if (baseQuery.includes('"') && absTerms.length > 0) {
    const words = absTerms[0].split(/\s+/).filter((w) => w.length > 2);
    if (words.length >= 2) {
      const andVersion = `abs:(${words.join(' AND ')})`;
      const otherParts = [...authorMatches, ...pubdateMatches, ...objectMatches].join(' ');
      const fullAndQuery = otherParts ? `${andVersion} ${otherParts}` : andVersion;

      suggestions.push({
        query: fullAndQuery,
        description: 'Terms anywhere in abstract',
      });
    }
  }

  // Variation 3: Try OR variation for multi-word topics
  if (absTerms.length > 0) {
    const words = absTerms[0].split(/\s+/).filter((w) => w.length > 2);
    if (words.length >= 2 && !baseQuery.includes(' OR ')) {
      const orVersion = `abs:(${words.join(' OR ')})`;
      const otherParts = [...authorMatches, ...pubdateMatches, ...objectMatches].join(' ');
      const fullOrQuery = otherParts ? `${orVersion} ${otherParts}` : orVersion;

      suggestions.push({
        query: fullOrQuery,
        description: 'Any term matches (broader)',
      });
    }
  }

  // Variation 4: First author variant if author present
  // Skip if query contains operator functions like citations(author:...) - don't corrupt them
  const hasOperatorWrappedAuthor = /\b(citations|references|trending|useful|similar|reviews)\s*\(\s*author:/i.test(
    baseQuery,
  );
  if (authorMatches.length > 0 && !baseQuery.includes('^author:') && !hasOperatorWrappedAuthor) {
    const firstAuthorQuery = baseQuery.replace(/author:("?)([^"\s]+)("?)/gi, '^author:$1$2$3');
    if (firstAuthorQuery !== baseQuery) {
      suggestions.push({
        query: firstAuthorQuery,
        description: 'First author only',
      });
    }
  }

  // Variation 5: Add high-citation filter for quality papers
  if (!baseQuery.includes('citation_count') && suggestions.length < 5) {
    suggestions.push({
      query: `${baseQuery} citation_count:[10 TO *]`,
      description: 'Cited papers (10+ citations)',
    });
  }

  // Ensure we have at least 3, at most 5 suggestions
  return suggestions.slice(0, 5);
}

interface ChatCompletionChoice {
  message: {
    content: string;
    role: string;
  };
}

interface ChatCompletionResponse {
  choices: ChatCompletionChoice[];
}

interface AutocompleteResponse {
  suggestions?: string[];
}

/**
 * Fetches author autocomplete suggestions from ADS API.
 * Uses in-memory cache with 1 hour TTL.
 * Returns empty array on timeout or error.
 */
async function fetchAuthorAutocomplete(term: string): Promise<string[]> {
  const cacheKey = `author:${term.toLowerCase()}`;
  const cached = autocompleteCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.suggestions;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AUTOCOMPLETE_TIMEOUT_MS);

    const url = new URL(ADS_AUTOCOMPLETE_URL);
    url.searchParams.set('term', term);
    url.searchParams.set('field', 'author');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.ADS_API_KEY || ''}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Autocomplete API error:', response.status);
      return [];
    }

    const data: AutocompleteResponse = await response.json();
    const suggestions = data.suggestions || [];

    // Cache the result
    autocompleteCache.set(cacheKey, { suggestions, timestamp: Date.now() });

    return suggestions;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Autocomplete timeout for:', term);
    } else {
      console.warn('Autocomplete error:', error);
    }
    return [];
  }
}

/**
 * Validates and corrects author names in a query using ADS autocomplete.
 * If an author name doesn't match any suggestions, replaces with best match.
 */
async function validateAuthors(query: string): Promise<string> {
  // Match author:"Name" or author:Name patterns
  const authorPattern = /author:["']?([^"'\s]+(?:,\s*[^"'\s]*)?)["']?/gi;
  const matches = [...query.matchAll(authorPattern)];

  if (matches.length === 0) {
    return query;
  }

  let validatedQuery = query;

  for (const match of matches) {
    const fullMatch = match[0];
    const authorName = match[1];

    // Skip if it's just a single letter (initial)
    if (authorName.length <= 2) {
      continue;
    }

    const suggestions = await fetchAuthorAutocomplete(authorName);

    if (suggestions.length === 0) {
      continue;
    }

    // Check if exact match exists (case-insensitive)
    const normalizedName = authorName.toLowerCase().replace(/[,.\s]+/g, '');
    const exactMatch = suggestions.find((s) => s.toLowerCase().replace(/[,.\s]+/g, '') === normalizedName);

    if (exactMatch) {
      // Author exists in ADS, use canonical form
      const replacement = `author:"${exactMatch}"`;
      validatedQuery = validatedQuery.replace(fullMatch, replacement);
    } else {
      // No exact match - use first suggestion (closest match)
      const replacement = `author:"${suggestions[0]}"`;
      validatedQuery = validatedQuery.replace(fullMatch, replacement);
    }
  }

  return validatedQuery;
}

interface SimbadTapResponse {
  data?: string[][];
}

/**
 * Fetches object aliases from SIMBAD TAP service.
 * Uses ADQL query to get all identifiers for an object.
 * Returns up to 5 common aliases (filters out catalog IDs like 2MASX, IRAS).
 */
async function fetchObjectAliases(objectName: string): Promise<string[]> {
  const cacheKey = `object:${objectName.toLowerCase().replace(/\s+/g, '')}`;
  const cached = objectNameCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.aliases;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SIMBAD_TIMEOUT_MS);

    const normalizedName = objectName.replace(/\s+/g, ' ').trim();
    const adqlQuery = `SELECT id FROM ident WHERE oidref IN (SELECT oidref FROM ident WHERE id = '${normalizedName}')`;

    const formData = new URLSearchParams();
    formData.append('REQUEST', 'doQuery');
    formData.append('PHASE', 'RUN');
    formData.append('FORMAT', 'json');
    formData.append('LANG', 'ADQL');
    formData.append('query', adqlQuery);

    const response = await fetch(SIMBAD_TAP_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('SIMBAD TAP error:', response.status);
      return [];
    }

    const data: SimbadTapResponse = await response.json();
    if (!data.data || data.data.length === 0) {
      return [];
    }

    const allIds = data.data.map((row) => row[0]).filter(Boolean);

    const priorityPatterns = [
      /^M\s*\d+$/i, // M31, M 31
      /^NGC\s*\d+/i, // NGC 224
      /^IC\s*\d+/i, // IC 1613
      /^NAME\s+/i, // NAME Andromeda
      /^Messier\s*\d+/i, // Messier 31
      /^Abell\s*\d+/i, // Abell clusters
      /^3C\s*\d+/i, // 3C radio sources
    ];

    const skipPatterns = [
      /^2MASX\s/i,
      /^IRAS\s/i,
      /^RAFGL\s/i,
      /^IRC\s/i,
      /^\[.*\]/, // Catalog references like [M98c]
      /^PLX\s/i,
      /^PPM\s/i,
      /^Z\s+\d/i, // Zwicky catalog entries
    ];

    const filteredIds = allIds
      .filter((id) => !skipPatterns.some((p) => p.test(id)))
      .map((id) => {
        if (id.startsWith('NAME ')) {
          return id.slice(5);
        }
        return id;
      });

    const prioritized = filteredIds.sort((a, b) => {
      const aPriority = priorityPatterns.findIndex((p) => p.test(a));
      const bPriority = priorityPatterns.findIndex((p) => p.test(b));
      const aScore = aPriority >= 0 ? aPriority : 100;
      const bScore = bPriority >= 0 ? bPriority : 100;
      return aScore - bScore;
    });

    const uniqueAliases = [...new Set(prioritized)].slice(0, 5);

    objectNameCache.set(cacheKey, { aliases: uniqueAliases, timestamp: Date.now() });

    return uniqueAliases;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('SIMBAD timeout for:', objectName);
    } else {
      console.warn('SIMBAD error:', error);
    }
    return [];
  }
}

/**
 * Detects astronomical object names in the natural language input.
 * Returns array of matched object names.
 */
function detectObjectNames(text: string): string[] {
  const matches: string[] = [];
  for (const pattern of OBJECT_NAME_PATTERNS) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found.map((m) => m.replace(/\s+/g, ' ').trim()));
    }
  }
  return [...new Set(matches)];
}

/**
 * Resolves object names in a query using SIMBAD and expands to include aliases.
 * Example: object:M31 -> object:(M31 OR "NGC 224" OR Andromeda)
 *
 * @param query - The ADS query containing object: fields
 * @param nlInput - Original natural language input to detect object names
 * @param resolve - Whether to resolve objects (default: true)
 */
async function resolveObjectNames(query: string, nlInput: string, resolve = true): Promise<string> {
  if (!resolve) {
    return query;
  }

  const objectPattern = /object:["']?([^"'\s]+(?:\s+[^"'\s]*)?)["']?/gi;
  const matches = [...query.matchAll(objectPattern)];

  const nlObjectNames = detectObjectNames(nlInput);

  if (matches.length === 0 && nlObjectNames.length === 0) {
    return query;
  }

  let resolvedQuery = query;

  for (const match of matches) {
    const fullMatch = match[0];
    const objectName = match[1];

    const aliases = await fetchObjectAliases(objectName);

    if (aliases.length > 1) {
      const orTerms = aliases.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' OR ');
      const replacement = `object:(${orTerms})`;
      resolvedQuery = resolvedQuery.replace(fullMatch, replacement);
    }
  }

  for (const objName of nlObjectNames) {
    const normalizedObjName = objName.replace(/\s+/g, '');
    if (!resolvedQuery.toLowerCase().includes(normalizedObjName.toLowerCase())) {
      const aliases = await fetchObjectAliases(objName);
      if (aliases.length > 0) {
        const orTerms = aliases.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' OR ');
        resolvedQuery = `${resolvedQuery} object:(${orTerms})`;
      }
    }
  }

  return resolvedQuery;
}

/**
 * Post-process query to convert read_count patterns to trending() operator
 * when user mentions "trending", "popular", "hot" etc.
 * This compensates for low operator example count in training data.
 */
function applyOperatorPostProcessing(query: string, nlInput: string): string {
  const lowerInput = nlInput.toLowerCase();
  let result = query;

  // Convert read_count patterns to trending() when user asks for trending/popular papers
  const trendingKeywords = ['trending', 'popular', 'hot', "what's hot", 'whats hot'];
  if (trendingKeywords.some((kw) => lowerInput.includes(kw))) {
    // If query uses read_count filter, convert to trending()
    const readCountMatch = result.match(/read_count:\[[^\]]+\]/);
    if (readCountMatch) {
      // Extract the core query without read_count
      const coreQuery = result.replace(/\s*read_count:\[[^\]]+\]\s*/g, ' ').trim();
      result = `trending(${coreQuery})`;
    }
  }

  // Convert to similar() when user asks for papers similar to a bibcode
  const similarKeywords = ['similar to', 'papers like', 'related to'];
  if (similarKeywords.some((kw) => lowerInput.includes(kw))) {
    // If query has identifier: or bibcode:, wrap in similar()
    // Bibcode format: YYYYJJJJJ...VVVVMPPPPA (e.g., 2019ApJ...887L...1K)
    const bibcodeMatch = result.match(
      /(?:identifier|bibcode):["']?(\d{4}[A-Za-z.]+\d+[A-Za-z.]+\d+[A-Za-z0-9.]+)["']?/i,
    );
    if (bibcodeMatch && !result.startsWith('similar(')) {
      result = `similar(bibcode:${bibcodeMatch[1]})`;
    }
  }

  // Convert to useful() when user asks for useful/important methodology papers
  const usefulKeywords = ['useful papers', 'methodology papers', 'important techniques'];
  if (usefulKeywords.some((kw) => lowerInput.includes(kw))) {
    const absMatch = result.match(/abs:["']?([^"'\s]+(?:\s+[^"'\s]+)*|"[^"]+")["']?/i);
    if (absMatch && !result.startsWith('useful(')) {
      result = `useful(${result})`;
    }
  }

  // Convert to reviews() when user asks for review papers
  const reviewKeywords = ['review papers', 'reviews of', 'comprehensive reviews'];
  if (reviewKeywords.some((kw) => lowerInput.includes(kw))) {
    if (!result.startsWith('reviews(')) {
      result = `reviews(${result})`;
    }
  }

  // Convert to citations() when user asks for papers citing something
  const citationsKeywords = ['papers citing', 'citations to', 'cited by papers about'];
  if (citationsKeywords.some((kw) => lowerInput.includes(kw))) {
    // Remove citation_count filter if present (model may add this for "citing" queries)
    const coreQuery = result.replace(/\s*citation_count:\[[^\]]+\]\s*/g, ' ').trim();
    if (!coreQuery.startsWith('citations(')) {
      result = `citations(${coreQuery})`;
    }
  }

  // Convert to references() when user asks for papers referenced by something
  const referencesKeywords = ['papers referenced by', 'references from', 'bibliography of'];
  if (referencesKeywords.some((kw) => lowerInput.includes(kw))) {
    if (!result.startsWith('references(')) {
      result = `references(${result})`;
    }
  }

  return result;
}

/**
 * Expands abs: queries with synonyms from the pre-computed synonym table.
 * Adds OR terms for broader recall while preserving the original term.
 *
 * Example: abs:"dark matter" -> abs:("dark matter" OR DM OR CDM OR WIMP)
 *
 * @param query - The ADS query to expand
 * @param expand - Whether to apply synonym expansion (default: true)
 * @returns The query with synonyms expanded, or original if expansion disabled
 */
function expandSynonyms(query: string, expand = true): string {
  if (!expand) {
    return query;
  }

  let result = query;

  // Find abs: fields with quoted or unquoted terms
  // Matches: abs:"term" or abs:term or abs:(term1 term2)
  const absPattern = /abs:(?:"([^"]+)"|(\S+))/gi;

  let match: RegExpExecArray | null;
  const replacements: Array<{ original: string; expanded: string }> = [];

  while ((match = absPattern.exec(query)) !== null) {
    const fullMatch = match[0];
    const term = (match[1] || match[2]).toLowerCase().trim();

    // Check if this term matches any synonym key
    let synonyms: string[] | undefined;

    // Try exact match first
    if (SYNONYM_TABLE[term]) {
      synonyms = SYNONYM_TABLE[term];
    } else {
      // Try partial match for multi-word terms
      for (const key of Object.keys(SYNONYM_TABLE)) {
        if (term.includes(key) || key.includes(term)) {
          synonyms = SYNONYM_TABLE[key];
          break;
        }
      }
    }

    if (synonyms && synonyms.length > 1) {
      // Build OR expansion: abs:("original" OR "syn1" OR "syn2")
      const orTerms = synonyms.map((s) => (s.includes(' ') ? `"${s}"` : s)).join(' OR ');
      const expanded = `abs:(${orTerms})`;
      replacements.push({ original: fullMatch, expanded });
    }
  }

  // Apply replacements (in reverse order to preserve indices)
  for (const { original, expanded } of replacements.reverse()) {
    result = result.replace(original, expanded);
  }

  return result;
}

/**
 * Calls the hybrid NER pipeline endpoint.
 * Returns null if pipeline fails, allowing fallback to vLLM.
 */
async function callPipeline(query: string): Promise<PipelineChatResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PIPELINE_TIMEOUT_MS);

    const today = new Date().toISOString().split('T')[0];

    const response = await fetch(PIPELINE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pipeline',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Query: ${query}\nDate: ${today}` },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[nl-search] Pipeline endpoint error:', response.status);
      return null;
    }

    const data: PipelineChatResponse = await response.json();

    // Check for pipeline errors
    if (data.error && !data.fallback) {
      console.warn('[nl-search] Pipeline returned error:', data.error);
      return null;
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[nl-search] Pipeline timeout');
    } else {
      console.warn('[nl-search] Pipeline error:', error);
    }
    return null;
  }
}

/**
 * Calls the vLLM fine-tuned model endpoint as fallback.
 */
async function callVLLM(query: string): Promise<ChatCompletionResponse | null> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const response = await fetch(VLLM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llm',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Query: ${query}\nDate: ${today}` },
        ],
        max_tokens: 128,
      }),
    });

    if (!response.ok) {
      console.error('[nl-search] vLLM endpoint error:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[nl-search] vLLM error:', error);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<NLSearchResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ query: '', error: 'Method not allowed. Use POST.' });
  }

  const {
    query: naturalLanguageQuery,
    expand: expandSynonymsOption = true,
    resolveObjects: resolveObjectsOption = true,
    usePipeline: usePipelineOption = true,
  } = req.body as NLSearchRequest;

  if (!naturalLanguageQuery || typeof naturalLanguageQuery !== 'string') {
    return res.status(400).json({ query: '', error: 'Missing query parameter' });
  }

  try {
    let rawModelQuery: string | null = null;
    let pipelineResult: PipelineResult | undefined;
    let usedPipeline = false;

    // Try hybrid NER pipeline first (if enabled)
    if (usePipelineOption) {
      const pipelineResponse = await callPipeline(naturalLanguageQuery);

      if (pipelineResponse && pipelineResponse.choices?.length > 0) {
        rawModelQuery = pipelineResponse.choices[0].message.content;
        pipelineResult = pipelineResponse.pipeline_result;
        usedPipeline = true;

        console.log('[nl-search] Pipeline query generated:', {
          input: naturalLanguageQuery,
          output: rawModelQuery,
          timing: pipelineResult?.debug_info?.total_time_ms,
        });
      }
    }

    // Fallback to vLLM if pipeline didn't produce a result
    if (!rawModelQuery) {
      console.log('[nl-search] Falling back to vLLM endpoint');

      const vllmResponse = await callVLLM(naturalLanguageQuery);

      if (!vllmResponse || !vllmResponse.choices?.length) {
        return res.status(502).json({
          query: '',
          error: 'No response from model endpoints',
        });
      }

      const content = vllmResponse.choices[0].message.content;

      // Strip thinking tags if present (from extended reasoning models)
      rawModelQuery = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      // Try JSON parsing (for backwards compatibility)
      const jsonMatch = rawModelQuery.match(/\{[\s\S]*"query"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]) as { query: string };
          rawModelQuery = parsed.query;
        } catch {
          // Fall through to use rawModelQuery as-is
        }
      }
    }

    // Validate we have a query
    if (!rawModelQuery || rawModelQuery.length === 0) {
      console.error('[nl-search] Failed to get query from endpoints');
      return res.status(502).json({
        query: '',
        error: 'Could not generate query',
      });
    }

    // Step 1: Validate field constraints before any processing
    const validationResult = validateFieldConstraints(rawModelQuery);
    const constraintViolations: ConstraintViolation[] = validationResult.errors.map((e) => ({
      field: e.field,
      value: e.value,
      suggestions: e.suggestions,
    }));

    // Step 2: Apply constraint filtering to remove invalid field values
    const { query: constrainedQuery, corrections } = constrainQueryOutput(rawModelQuery);

    // Log all corrections made for debugging
    if (corrections.length > 0) {
      console.log('[nl-search] Field constraint corrections applied:', {
        originalQuery: rawModelQuery,
        constrainedQuery,
        corrections: corrections.map((c) => `${c.field}:${c.originalValue} (${c.action})`),
        usedPipeline,
      });
    }

    // Step 3: Apply operator post-processing as fallback for operators with low coverage
    // (Skip if pipeline was used - it handles operators correctly)
    let processedQuery = usedPipeline
      ? constrainedQuery
      : applyOperatorPostProcessing(constrainedQuery, naturalLanguageQuery);

    // Step 4: Validate and correct author names using ADS autocomplete
    processedQuery = await validateAuthors(processedQuery);

    // Step 5: Resolve object names via SIMBAD and expand to aliases (can be disabled via resolveObjects: false)
    processedQuery = await resolveObjectNames(processedQuery, naturalLanguageQuery, resolveObjectsOption);

    // Step 6: Apply synonym expansion for broader recall (can be disabled via expand: false)
    const expandedQuery = expandSynonyms(processedQuery, expandSynonymsOption);

    // Step 7: Generate multiple query variations for UX purposes
    const queries = generateQueryVariations(expandedQuery);

    // Build response with constraint violation details if any
    const nlResponse: NLSearchResponse = {
      query: expandedQuery,
      queries,
    };

    // Include constraint violation details if any violations were detected
    if (constraintViolations.length > 0) {
      nlResponse.constraintViolations = constraintViolations;
      nlResponse.rawQuery = rawModelQuery;
    }

    // Include corrections if any were made
    if (corrections.length > 0) {
      nlResponse.corrections = corrections;
      if (!nlResponse.rawQuery) {
        nlResponse.rawQuery = rawModelQuery;
      }
    }

    // Include pipeline debug info for debugging/monitoring
    if (pipelineResult) {
      nlResponse.pipelineDebug = {
        intent: pipelineResult.intent,
        retrievedExamples: pipelineResult.retrieved_examples,
        timing: {
          nerMs: pipelineResult.debug_info.ner_time_ms,
          retrievalMs: pipelineResult.debug_info.retrieval_time_ms,
          assemblyMs: pipelineResult.debug_info.assembly_time_ms,
          totalMs: pipelineResult.debug_info.total_time_ms,
        },
        constraintCorrections: pipelineResult.debug_info.constraint_corrections,
        fallbackReason: pipelineResult.debug_info.fallback_reason,
        usedPipeline: true,
      };
    } else {
      nlResponse.pipelineDebug = {
        intent: {},
        retrievedExamples: [],
        timing: { nerMs: 0, retrievalMs: 0, assemblyMs: 0, totalMs: 0 },
        constraintCorrections: [],
        fallbackReason: usedPipeline ? null : 'vLLM fallback',
        usedPipeline: false,
      };
    }

    return res.status(200).json(nlResponse);
  } catch (error) {
    console.error('NL search error:', error);
    return res.status(500).json({
      query: '',
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
