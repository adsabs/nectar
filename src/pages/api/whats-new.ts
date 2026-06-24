import type { NextApiRequest, NextApiResponse } from 'next';
import { XMLParser } from 'fast-xml-parser';
import { WHATS_NEW_FEED_URL } from '@/config';

export interface WhatsNewItem {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
}

export interface WhatsNewResponse {
  items: WhatsNewItem[];
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
const ITEM_LIMIT = 5;
const FETCH_TIMEOUT_MS = 5000;

const toStr = (v: unknown): string => (v == null ? '' : String(v).trim());

const extractTitle = (title: unknown): string => {
  if (!title) {
    return '';
  }
  if (typeof title === 'string') {
    return title.trim();
  }
  if (typeof title === 'object' && title !== null) {
    const obj = title as Record<string, unknown>;
    return toStr(obj['#text'] ?? obj['_text'] ?? '');
  }
  return '';
};

// Atom link is an object or array of objects with @_href; RSS link is a plain string.
const extractLink = (link: unknown, fallback = ''): string => {
  if (!link) {
    return fallback;
  }
  if (typeof link === 'string') {
    return link.trim() || fallback;
  }
  if (Array.isArray(link)) {
    const alt =
      link.find(
        (l) => typeof l === 'object' && l !== null && (l as Record<string, unknown>)['@_rel'] === 'alternate',
      ) ?? link[0];
    return extractLink(alt, fallback);
  }
  if (typeof link === 'object' && link !== null) {
    return toStr((link as Record<string, unknown>)['@_href']) || fallback;
  }
  return fallback;
};

const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractText = (v: unknown): string => {
  if (!v) {
    return '';
  }
  if (typeof v === 'string') {
    return stripHtml(v);
  }
  if (typeof v === 'object' && v !== null) {
    const obj = v as Record<string, unknown>;
    return stripHtml(toStr(obj['#text'] ?? obj['_text'] ?? ''));
  }
  return '';
};

const rewriteItemUrl = (url: string): string => {
  if (url.startsWith('/blog/')) {
    return '/scixblog/' + url.slice('/blog/'.length);
  }
  if (url.startsWith('/')) {
    return url;
  }
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/blog\//, '/scixblog/');
    return path + parsed.search + parsed.hash;
  } catch {
    return url;
  }
};

const toRawArray = (v: unknown): Record<string, unknown>[] => {
  if (Array.isArray(v)) {
    return v as Record<string, unknown>[];
  }
  if (v && typeof v === 'object') {
    return [v as Record<string, unknown>];
  }
  return [];
};

const extractItems = (parsed: Record<string, unknown>): WhatsNewItem[] => {
  const rss = parsed?.rss as Record<string, unknown> | undefined;

  // RSS 2.0
  if (rss?.channel) {
    const channel = rss.channel as Record<string, unknown>;
    return toRawArray(channel.item)
      .slice(0, ITEM_LIMIT)
      .map((item) => ({
        title: extractTitle(item.title),
        link: rewriteItemUrl(extractLink(item.link, toStr(item.guid))),
        pubDate: toStr(item.pubDate ?? item.published),
        summary: extractText(item.description ?? item.summary),
      }));
  }

  // Atom
  const feed = parsed?.feed as Record<string, unknown> | undefined;
  if (feed) {
    return toRawArray(feed.entry)
      .slice(0, ITEM_LIMIT)
      .map((item) => ({
        title: extractTitle(item.title),
        link: rewriteItemUrl(extractLink(item.link, toStr(item.id))),
        pubDate: toStr(item.published ?? item.updated),
        summary: extractText(item.summary ?? item.content),
      }));
  }

  return [];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<WhatsNewResponse>) {
  try {
    const feedRes = await fetch(WHATS_NEW_FEED_URL, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!feedRes.ok) {
      return res.status(200).json({ items: [] });
    }

    const xml = await feedRes.text();
    const parsed = parser.parse(xml) as Record<string, unknown>;
    const items = extractItems(parsed);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({ items });
  } catch {
    return res.status(200).json({ items: [] });
  }
}
