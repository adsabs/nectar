// EXPERIMENTAL (SCIX-904): throwaway instrumentation — remove with the scix_id migration.
import create from 'zustand';

export type ScixIdFallbackReason = 'no-scix-id' | 'backend-requires-bibcode';

export interface ScixIdFallbackEntry {
  surface: string;
  reason: ScixIdFallbackReason;
  bibcode?: string;
  scixId?: string;
  at: number;
  count: number;
}

type RecordInput = Pick<ScixIdFallbackEntry, 'surface' | 'reason' | 'bibcode' | 'scixId'>;

interface FallbackStoreState {
  entries: ScixIdFallbackEntry[];
}

// True when the HUD env flag is set, or (browser only) the URL carries a
// `scixdebug` query param. SSR-safe: never touches `window` on the server.
export const isScixIdDebugEnabled = (): boolean => {
  if (process.env.NEXT_PUBLIC_SCIX_ID_HUD === 'true') {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).has('scixdebug');
};

const keyOf = (surface: string, reason: ScixIdFallbackReason): string => `${surface}|${reason}`;

export const useFallbackStore = create<FallbackStoreState>(() => ({ entries: [] }));

// No-ops unless debug is enabled, so there is zero prod overhead and the
// entries array cannot grow unbounded. The store write is deferred to a
// microtask so callers can safely invoke record() during React render (the
// helpers are meant to be called inline in param/URL builders) without
// triggering a cross-component setState on the HUD's subscription.
export const record = (entry: RecordInput): void => {
  if (!isScixIdDebugEnabled()) {
    return;
  }
  const at = Date.now();
  const key = keyOf(entry.surface, entry.reason);
  queueMicrotask(() => {
    useFallbackStore.setState((state) => {
      const index = state.entries.findIndex((e) => keyOf(e.surface, e.reason) === key);
      if (index === -1) {
        return { entries: [...state.entries, { ...entry, at, count: 1 }] };
      }
      const next = state.entries.slice();
      const existing = next[index];
      next[index] = { ...existing, ...entry, at, count: existing.count + 1 };
      return { entries: next };
    });
  });
};

export const clear = (): void => useFallbackStore.setState({ entries: [] });

export const useScixIdFallbacks = (): { entries: ScixIdFallbackEntry[]; clear: () => void } => {
  const entries = useFallbackStore((state) => state.entries);
  return { entries, clear };
};
