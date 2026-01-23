import { useEffect, useState } from 'react';

export interface QuerySuggestion {
  query: string;
  description: string;
}

interface NLSearchResult {
  query: string | null;
  queries: QuerySuggestion[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  isLoading: boolean;
  error: string | null;
  resultCount: number | null;
  isLoadingCount: boolean;
}

interface NLSearchResponse {
  query: string;
  queries?: QuerySuggestion[];
  error?: string;
}

interface SearchCountResponse {
  response: {
    numFound: number;
  };
}

export const useNLSearch = (
  naturalLanguageQuery: string,
  onQueryGenerated?: (query: string) => void,
): NLSearchResult => {
  const [query, setQuery] = useState<string | null>(null);
  const [queries, setQueries] = useState<QuerySuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  useEffect(() => {
    if (!naturalLanguageQuery || naturalLanguageQuery.trim().length < 3) {
      setQuery(null);
      setQueries([]);
      setSelectedIndex(0);
      setError(null);
      setResultCount(null);
      return;
    }

    const controller = new AbortController();
    let isCancelled = false;

    const fetchQuery = async () => {
      setIsLoading(true);
      setError(null);
      setResultCount(null);
      setQueries([]);
      setSelectedIndex(0);

      try {
        const response = await fetch('/api/nl-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: naturalLanguageQuery }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to translate query: ${response.statusText}`);
        }

        const data: NLSearchResponse = await response.json();

        if (!isCancelled) {
          if (data.error) {
            setError(data.error);
            setQuery(null);
            setQueries([]);
          } else {
            setQuery(data.query);
            setQueries(data.queries || []);
            setSelectedIndex(0);
            if (data.query && onQueryGenerated) {
              onQueryGenerated(data.query);
            }
          }
        }
      } catch (err) {
        if (!isCancelled && err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
          setQuery(null);
          setQueries([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchQuery();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [naturalLanguageQuery, onQueryGenerated]);

  // Fetch result count for the currently selected query
  const selectedQuery = queries[selectedIndex]?.query || query;

  useEffect(() => {
    if (!selectedQuery) {
      setResultCount(null);
      return;
    }

    const controller = new AbortController();
    let isCancelled = false;

    const fetchResultCount = async () => {
      setIsLoadingCount(true);

      try {
        const params = new URLSearchParams({
          q: selectedQuery,
          rows: '0',
          fl: 'bibcode',
        });
        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data: SearchCountResponse = await response.json();

        if (!isCancelled && data?.response?.numFound !== undefined) {
          setResultCount(data.response.numFound);
        }
      } catch {
        // Silently fail for count preview - not critical
      } finally {
        if (!isCancelled) {
          setIsLoadingCount(false);
        }
      }
    };

    fetchResultCount();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [selectedQuery]);

  return { query, queries, selectedIndex, setSelectedIndex, isLoading, error, resultCount, isLoadingCount };
};
