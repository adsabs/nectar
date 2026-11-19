import { describe, expect, test } from 'vitest';
import {
  getLegacyHashSnippet,
  LEGACY_REDIRECT_CLASS,
  LEGACY_REDIRECT_CSS,
  LEGACY_REDIRECT_TIMEOUT_MS,
} from './legacy-hash-snippet';
import {
  LEGACY_PAYLOAD_ROOTS,
  LEGACY_ROUTE_ROOTS,
  LEGACY_STANDALONE_ROOTS,
  resolveLegacyHashRoute,
} from '@/lib/legacyRoutes';

const runSnippet = (hash: string) => {
  const classes = new Set<string>();
  const timers: { fn: () => void; delay: number }[] = [];
  const html = {
    classList: {
      add: (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
    },
  };
  const scope = {
    window: { location: { hash }, setTimeout: (fn: () => void, delay: number) => timers.push({ fn, delay }) },
    document: { documentElement: html },
  };

  new Function('window', 'document', getLegacyHashSnippet())(scope.window, scope.document);

  return { classes, timers };
};

describe('getLegacyHashSnippet', () => {
  test('marks the document for a root carrying a payload', () => {
    for (const root of LEGACY_PAYLOAD_ROOTS) {
      const { classes } = runSnippet(`#${root}/anything`);
      expect(classes.has(LEGACY_REDIRECT_CLASS), `root ${root} should be marked`).toBe(true);
    }
  });

  test('marks the document for a standalone root', () => {
    for (const root of LEGACY_STANDALONE_ROOTS) {
      const { classes } = runSnippet(`#${root}`);
      expect(classes.has(LEGACY_REDIRECT_CLASS), `root ${root} should be marked`).toBe(true);
    }
  });

  test('ignores a payload root with nothing after it, so a bare anchor cannot trigger it', () => {
    for (const root of LEGACY_PAYLOAD_ROOTS) {
      expect(runSnippet(`#${root}`).classes.has(LEGACY_REDIRECT_CLASS), `bare #${root}`).toBe(false);
      expect(runSnippet(`#${root}/`).classes.has(LEGACY_REDIRECT_CLASS), `#${root}/`).toBe(false);
    }
  });

  test('ignores a standalone root that carries a payload', () => {
    for (const root of LEGACY_STANDALONE_ROOTS) {
      expect(runSnippet(`#${root}/extra`).classes.has(LEGACY_REDIRECT_CLASS), `#${root}/extra`).toBe(false);
    }
  });

  test('ignores every in-page anchor the app actually uses', () => {
    for (const hash of ['#', '#results', '#abstract', '#abstract-section', '#main-content-section']) {
      expect(runSnippet(hash).classes.has(LEGACY_REDIRECT_CLASS), hash).toBe(false);
    }
  });

  test('tolerates a leading slash or shebang', () => {
    expect(runSnippet('#/abs/2016PhRvL.116f1102A').classes.has(LEGACY_REDIRECT_CLASS)).toBe(true);
    expect(runSnippet('#!/abs/2016PhRvL.116f1102A').classes.has(LEGACY_REDIRECT_CLASS)).toBe(true);
  });

  test('leaves in-page anchors and unmapped roots untouched', () => {
    for (const hash of ['', '#results', '#abstract', '#abstract-section', '#execute-query/abc', '#404']) {
      expect(runSnippet(hash).classes.has(LEGACY_REDIRECT_CLASS), `hash ${hash || '(empty)'}`).toBe(false);
    }
  });

  test('schedules a self-clearing timeout so a stalled redirect cannot wedge the page', () => {
    const { timers, classes } = runSnippet('#abs/2016PhRvL.116f1102A/metrics');
    expect(timers).toHaveLength(1);
    expect(timers[0].delay).toBe(LEGACY_REDIRECT_TIMEOUT_MS);

    timers[0].fn();
    expect(classes.has(LEGACY_REDIRECT_CLASS)).toBe(false);
  });

  test('does not schedule a timeout when it did not mark the document', () => {
    expect(runSnippet('#results').timers).toHaveLength(0);
  });

  test('schedules the reveal before hiding anything, so the page cannot stay hidden', () => {
    const snippet = getLegacyHashSnippet();
    expect(snippet.indexOf('setTimeout')).toBeLessThan(snippet.indexOf('classList.add'));
  });

  test('embeds the roots rather than a hand-maintained copy', () => {
    const snippet = getLegacyHashSnippet();
    for (const root of LEGACY_ROUTE_ROOTS) {
      expect(snippet).toContain(`"${root}"`);
    }
  });

  test('every root is classified exactly once', () => {
    const overlap = LEGACY_PAYLOAD_ROOTS.filter((r) => LEGACY_STANDALONE_ROOTS.includes(r));
    expect(overlap).toEqual([]);
    expect(LEGACY_ROUTE_ROOTS).toHaveLength(LEGACY_PAYLOAD_ROOTS.length + LEGACY_STANDALONE_ROOTS.length);
  });
});

describe('LEGACY_ROUTE_ROOTS', () => {
  const sample: Record<string, string> = {
    abs: '#abs/2016PhRvL.116f1102A',
    'classic-form': '#classic-form',
    index: '#index',
    'paper-form': '#paper-form',
    'public-libraries': '#public-libraries/PcKKUoh1RTGjbqSI5vF-1w',
    search: '#search/q=star',
    user: '#user/libraries',
  };

  test('every root resolves to a real target', () => {
    for (const root of LEGACY_ROUTE_ROOTS) {
      expect(sample[root], `add a sample hash for root ${root}`).toBeDefined();
      expect(resolveLegacyHashRoute(sample[root]), `root ${root} should resolve`).not.toBeNull();
    }
  });
});

describe('LEGACY_REDIRECT_CSS', () => {
  test('blanks the page content but keeps the header and footer', () => {
    expect(LEGACY_REDIRECT_CSS).toContain(`html.${LEGACY_REDIRECT_CLASS} main > *`);
    expect(LEGACY_REDIRECT_CSS).not.toMatch(/html\.[\w-]+ (nav|footer)/);
  });

  test('also suppresses overlays portalled outside main', () => {
    for (const selector of ['.chakra-portal', '.shepherd-element', '.shepherd-modal-overlay-container']) {
      expect(LEGACY_REDIRECT_CSS).toContain(`html.${LEGACY_REDIRECT_CLASS} ${selector}`);
    }
  });

  test('renders the message as plain text near the top, without touching the DOM', () => {
    expect(LEGACY_REDIRECT_CSS).toContain(`html.${LEGACY_REDIRECT_CLASS}::after`);
    expect(LEGACY_REDIRECT_CSS).toContain("content: 'This link has moved. Taking you there\\002026'");
    expect(LEGACY_REDIRECT_CSS).toContain('top: 7rem');
    expect(LEGACY_REDIRECT_CSS).not.toContain('border');
    expect(LEGACY_REDIRECT_CSS).not.toContain('box-shadow');
  });

  test('takes its colour from the pre-hydration theme attribute, not the OS preference', () => {
    expect(LEGACY_REDIRECT_CSS).toContain(`html.${LEGACY_REDIRECT_CLASS}[data-theme='dark']::after`);
    expect(LEGACY_REDIRECT_CSS).not.toContain('prefers-color-scheme');
  });
});
