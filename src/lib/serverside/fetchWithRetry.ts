// Server-side fetch with bounded retry on the outcomes a retry can fix — 429, 5xx,
// network/timeout — so a transient Solr/token blip doesn't paint a false negative
// into the SSR HTML. Client retries are React Query's job.

export const isRetryableStatus = (status: number): boolean => status === 429 || status >= 500;

export type FetchAttemptInfo = {
  attempt: number;
  status?: number;
  error?: unknown;
  willRetry: boolean;
};

type FetchWithRetryOptions = {
  retries?: number;
  backoffMs?: number;
  onAttempt?: (info: FetchAttemptInfo) => void;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchWithRetry = async (
  input: URL | string,
  init: RequestInit,
  options: FetchWithRetryOptions = {},
): Promise<Response> => {
  const { retries = 2, backoffMs = 150, onAttempt } = options;
  let attempt = 0;

  for (;;) {
    try {
      const response = await fetch(input, init);
      const willRetry = attempt < retries && isRetryableStatus(response.status);
      onAttempt?.({ attempt, status: response.status, willRetry });
      if (!willRetry) {
        return response;
      }
    } catch (error) {
      const willRetry = attempt < retries;
      onAttempt?.({ attempt, error, willRetry });
      if (!willRetry) {
        throw error;
      }
    }

    if (backoffMs > 0) {
      await wait(backoffMs * (attempt + 1));
    }
    attempt += 1;
  }
};
