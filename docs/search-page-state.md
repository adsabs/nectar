# Search Page State Model

As-built design for the search page after the nuqs rewrite
(`refactor/search-page-nuqs-rewrite`, 2026-07). Supersedes the 2026-03-12
spec/plan drafts, which were never committed.

## Principle

The URL is the single source of truth for the submitted query. There is no
store mirror of it: the Zustand search slice no longer holds `latestQuery`,
`prevQuery`, or `searchStatus`, and no store↔URL sync effects exist. What the
slice still owns is genuinely client state:

- `query` + `updateQuery` / `queryAddition` / `clearQueryFlag` — the
  SearchBar's intermediate draft input (see `useIntermediateQuery`)
- `numPerPage` — the persisted page-size preference

## Hook chain

```
URL (nuqs) → useSearchQueryParams → useSearchResults → useSearchPage → page shell
```

All three hooks live in `src/lib/search/`. They must NOT move under
`src/pages/` — the repo does not configure `pageExtensions`, so any file
under `src/pages/` becomes a route (this broke the production build once).

### useSearchQueryParams

Declares nuqs parsers for the params the page owns: `q`, `sort`, `p`, `rows`,
`fq`, `showHighlights`. `fq` and `sort` are native arrays (repeated keys,
`?fq=A&fq=B`). `sort` and `rows` have no static default: absence means
"resolve from user settings" (preferred sort, persisted page size), applied
by `canonicalSearchParams`. Dynamic facet companion params (`fq_author`, …)
pass through from `router.query`. Writes use history push + Next-shallow +
no scroll, matching the pre-rewrite navigation.

When a `/search` URL arrives without `sort` or `rows`, the hook stamps the
resolved values back into the URL (`history: replace`) so every history
entry captures the full search state — otherwise a later change to the
user's preferred sort or page size would silently change what old URLs
mean. The stamp waits for settings when authenticated (so the preferred
sort, not the static default, is written) and fires at most once per URL
(arrival-time canonicalization; re-firing could race a concurrent user
navigation with stale values).

### useSearchResults

Wraps `useSearch` with `keepPreviousData` and derives `searchStatus`
(`idle | loading | success | empty | error`) from the query state — the
replacement for the store-written field. Nuance: under `keepPreviousData` a
new query key sets `isFetching + isPreviousData` (not `isLoading`); that
combination counts as `loading` so facets stay gated during a genuinely new
search, while a background refetch of the same key stays `success`. Also
exposes `numFound`, `isPartialResults`, and the slow-search flag
(5 s threshold). The page shell renders result skeletons whenever the
status is `loading` (new query key) rather than showing the previous
query's docs; `keepPreviousData` still keeps `numFound` and stats stable
through the transition.

### useSearchPage

Composes params, boost application (`useApplyBoostTypeToParams`), results,
and all page-level handlers (submit, sort, per-page, facet submission,
highlights toggle). Effects it owns:

- publishes result bibcodes to the docs slice on genuine success
- corrects out-of-range `p` to the last valid page after the response
  (`history: replace`)
- fires `search_no_results` GTM events, deduped per query

`start` is pure URL math (`(p − 1) × rows`); it is never clamped against a
previous query's `numFound`. Facet submissions can add dynamic companion
params nuqs cannot write, so they navigate through `router.push` with the
full param set.

## SearchQueryContext

`src/lib/SearchQueryContext.tsx` — a read-only context distributing the
active search's canonical query (`facetParams` = post-boost params minus
pagination/field-list keys, via `toFacetSearchParams`) and `searchStatus`
to widgets below the page shell: SearchFacet, YearHistogramSlider, NumFound
stats, AddToLibraryModal, QueryForm. It is intentionally not writable.
Outside the search page the default value (`q: ''`, `idle`) keeps consumers
gated exactly like an idle search.

## Off-page consumers of the submitted query

- **Telemetry** (`src/providers.tsx`): Sentry search-submit/pagination spans
  key on the `/search` URL (`router.asPath` when `pathname === '/search'`),
  parsed with `parseQueryFromUrl`.
- **Feedback** (`src/pages/feedback/general.tsx`): `current_query` comes
  from the captured back-to-results URL (SCIX-881 session storage), absent
  when the user has not searched.
- Landing page and AbstractSearchForm submit purely by `router.push` with
  `makeSearchParams`; the old `submitQuery()` store action is gone.

## Invariants

- `sort` stays typed as `SolrSort[]` end to end; never cast to `string[]`.
- Telemetry reads `useRouter()` (Pages Router), not `useSearchParams`.
- Facet gating (SCIX-871): facet requests fire only when
  `searchStatus === 'success'`.
- Second-order operator queries reset sort to relevance on submit (SCIX-889).
- `numPerPage` is written only by the explicit per-page control, never as a
  side effect of URL state.
- Every `/search` history entry is self-describing: missing `sort`/`rows`
  are stamped into the URL on arrival (see useSearchQueryParams).
