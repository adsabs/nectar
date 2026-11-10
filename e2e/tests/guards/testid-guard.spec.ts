import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from '@playwright/test';

const E2E_DIR = join(__dirname, '..', '..');
const REPO_ROOT = join(E2E_DIR, '..');
const POM_DIR = join(E2E_DIR, 'pages');
const SRC_DIR = join(REPO_ROOT, 'src');

const SRC_EXCLUDE_PATTERN = /__tests__|__snapshots__|__mocks__|\.test\.|\.spec\./;
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

const POM_BRACKET_SELECTOR = /\[data-testid="([^"]+)"\]/g;
const POM_GET_BY_TEST_ID = /getByTestId\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
const SRC_TEST_ID_LITERAL = /data-testid=(?:"([^"]+)"|'([^']+)'|\{\s*['"]([^'"]+)['"]\s*\})/g;
const SRC_TEST_ID_TEMPLATE = /data-testid=\{\s*`([^`]*)`\s*\}/g;
const TEMPLATE_HOLE = /\$\{[^}]*\}/g;
const REGEX_METACHARACTERS = /[.*+?^${}()|[\]\\]/g;
const MIN_TEMPLATE_LITERAL_LENGTH = 4;

type TestIdReference = {
  testId: string;
  file: string;
};

type DefinedTestIds = {
  literals: Set<string>;
  patterns: RegExp[];
};

const collectSourceFiles = (dir: string): string[] =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => SOURCE_EXTENSIONS.some((ext) => file.endsWith(ext)));

const matchTestIds = (content: string, pattern: RegExp): string[] => {
  const found: string[] = [];
  for (const match of content.matchAll(pattern)) {
    const captured = match.slice(1).find((group) => typeof group === 'string');
    if (captured) {
      found.push(captured);
    }
  }
  return found;
};

export const templateToPattern = (template: string): RegExp | null => {
  const literals = template.split(TEMPLATE_HOLE);
  if (literals.join('').length < MIN_TEMPLATE_LITERAL_LENGTH) {
    return null;
  }

  const escaped = literals.map((part) => part.replace(REGEX_METACHARACTERS, '\\$&')).join('.+');
  return new RegExp(`^${escaped}$`);
};

export const collectPomTestIdReferences = (): TestIdReference[] => {
  const references: TestIdReference[] = [];
  for (const file of collectSourceFiles(POM_DIR)) {
    const content = readFileSync(file, 'utf8');
    const testIds = [...matchTestIds(content, POM_BRACKET_SELECTOR), ...matchTestIds(content, POM_GET_BY_TEST_ID)];
    for (const testId of testIds) {
      references.push({ testId, file: relative(REPO_ROOT, file) });
    }
  }
  return references;
};

export const collectSrcTestIds = (): DefinedTestIds => {
  const literals = new Set<string>();
  const patterns: RegExp[] = [];
  const files = collectSourceFiles(SRC_DIR).filter((file) => !SRC_EXCLUDE_PATTERN.test(file));

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    for (const testId of matchTestIds(content, SRC_TEST_ID_LITERAL)) {
      literals.add(testId);
    }
    for (const template of matchTestIds(content, SRC_TEST_ID_TEMPLATE)) {
      const pattern = templateToPattern(template);
      if (pattern) {
        patterns.push(pattern);
      }
    }
  }

  return { literals, patterns };
};

export const findMissingTestIds = (references: TestIdReference[], defined: DefinedTestIds): TestIdReference[] =>
  references.filter(
    (reference) =>
      !defined.literals.has(reference.testId) && !defined.patterns.some((pattern) => pattern.test(reference.testId)),
  );

test.describe('@guard testid guard', () => {
  test('every data-testid referenced by a page object exists in src', () => {
    const references = collectPomTestIdReferences();
    const defined = collectSrcTestIds();

    expect(references.length, 'scanner found no POM testid references').toBeGreaterThan(0);
    expect(defined.literals.size, 'scanner found no literal src testids').toBeGreaterThan(0);

    const missing = findMissingTestIds(references, defined);
    expect(missing.map((reference) => `${reference.testId} -> ${reference.file}`)).toEqual([]);
  });

  test('guard reports a referenced testid that src does not define', () => {
    const synthetic: TestIdReference[] = [
      { testId: 'guard-self-check-absent-testid', file: 'e2e/pages/synthetic.page.ts' },
    ];

    expect(findMissingTestIds(synthetic, collectSrcTestIds())).toEqual(synthetic);
  });

  test('guard resolves testids that src builds from a template literal', () => {
    const defined = collectSrcTestIds();

    expect(defined.patterns.length, 'scanner found no templated src testids').toBeGreaterThan(0);

    const templated: TestIdReference[] = [
      { testId: 'search-facet-root-item', file: 'e2e/pages/synthetic.page.ts' },
      { testId: 'search-facet-child-list', file: 'e2e/pages/synthetic.page.ts' },
    ];

    expect(findMissingTestIds(templated, defined)).toEqual([]);
    expect(defined.literals.has('search-facet-root-item')).toBe(false);
  });

  test('template conversion does not match across a separator', () => {
    const pattern = templateToPattern('search-facet-${level}-list');

    expect(pattern).not.toBeNull();
    expect(pattern?.test('search-facet-root-list')).toBe(true);
    expect(pattern?.test('search-facet--list')).toBe(false);
    expect(pattern?.test('prefixed-search-facet-root-list')).toBe(false);
  });

  test('a template with too little literal text is rejected, not turned into a wildcard', () => {
    expect(templateToPattern('${id}')).toBeNull();
    expect(templateToPattern('${a}${b}')).toBeNull();
    expect(templateToPattern('${a}-${b}')).toBeNull();
    expect(templateToPattern('row-${id}')).not.toBeNull();
  });
});
