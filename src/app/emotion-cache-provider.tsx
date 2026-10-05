'use client';

import createCache, { EmotionCache } from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { ReactNode, useState } from 'react';

type Registry = {
  cache: EmotionCache;
  flush: () => string[];
};

const createRegistry = (): Registry => {
  const cache = createCache({ key: 'css' });
  cache.compat = true;

  const prevInsert = cache.insert;
  let inserted: string[] = [];

  cache.insert = (...args) => {
    const serialized = args[1];
    if (cache.inserted[serialized.name] === undefined) {
      inserted.push(serialized.name);
    }
    return prevInsert(...args);
  };

  const flush = (): string[] => {
    const flushed = inserted;
    inserted = [];
    return flushed;
  };

  return { cache, flush };
};

export const EmotionCacheProvider = ({ children }: { children: ReactNode }) => {
  const [registry] = useState(createRegistry);

  useServerInsertedHTML(() => {
    const names = registry.flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    for (const name of names) {
      styles += registry.cache.inserted[name];
    }
    return (
      <style
        key="emotion-css-cache"
        data-emotion={`${registry.cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
};
