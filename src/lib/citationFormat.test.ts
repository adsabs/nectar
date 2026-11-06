import { describe, expect, it } from 'vitest';

import { MostUsedExportFormats } from '@/api/export/types';
import { DEFAULT_EXPORT_FORMATS } from '@/components/CitationExporter/models';
import { AppMode } from '@/types';

import {
  disciplineCitationFormatId,
  DISCIPLINE_CITATION_DEFAULTS,
  resolveCitationFormat,
  resolveRouteFormat,
} from './citationFormat';

const SAVED = [
  { id: 'format-aaaa', name: 'My Format', code: '%1H:%Y:%q' },
  { id: 'format-bbbb', name: 'Another', code: '%ZEncoding:latex\\bibitem{%R}' },
];

const resolve = (overrides: Partial<Parameters<typeof resolveCitationFormat>[0]> = {}) =>
  resolveCitationFormat({
    isAuthenticated: false,
    defaultExportFormatLabel: 'BibTeX',
    customFormats: [],
    appMode: AppMode.GENERAL,
    formats: DEFAULT_EXPORT_FORMATS,
    ...overrides,
  });

describe('resolveCitationFormat', () => {
  describe('signed out — discipline defaults (criterion 4)', () => {
    it.each([
      { appMode: AppMode.ASTROPHYSICS, id: 'bibtex', name: 'BibTeX' },
      { appMode: AppMode.HELIOPHYSICS, id: 'agu', name: 'AGU' },
      { appMode: AppMode.PLANET_SCIENCE, id: 'icarus', name: 'Icarus' },
      { appMode: AppMode.EARTH_SCIENCE, id: 'agu', name: 'AGU' },
      { appMode: AppMode.GENERAL, id: 'agu', name: 'AGU' },
      { appMode: AppMode.BIO_PHYSICAL, id: 'apsj', name: 'APS Journals' },
    ])('$appMode resolves to $name', ({ appMode, id, name }) => {
      const resolved = resolve({ isAuthenticated: false, appMode });

      expect(resolved.id).toBe(id);
      expect(resolved.name).toBe(name);
    });

    it('ignores a saved export preference when not authenticated', () => {
      const resolved = resolve({
        isAuthenticated: false,
        appMode: AppMode.PLANET_SCIENCE,
        defaultExportFormatLabel: 'BibTeX',
        customFormats: SAVED,
      });

      expect(resolved.id).toBe('icarus');
    });
  });

  describe('signed in — defaultExportFormat (criterion 3)', () => {
    it('resolves a curated format by its stored label', () => {
      const resolved = resolve({ isAuthenticated: true, defaultExportFormatLabel: 'BibTeX' });

      expect(resolved.id).toBe('bibtex');
      expect(resolved.name).toBe('BibTeX');
      expect(resolved.customFormat).toBeUndefined();
    });

    it('honours a format outside MostUsedExportFormats rather than flooring it', () => {
      const resolved = resolve({ isAuthenticated: true, defaultExportFormatLabel: 'APS Journals' });

      expect(resolved.id).toBe('apsj');
      expect(resolved.name).toBe('APS Journals');
    });

    it('resolves the first saved custom format, carrying its template and id', () => {
      const resolved = resolve({
        isAuthenticated: true,
        defaultExportFormatLabel: 'custom',
        customFormats: SAVED,
      });

      expect(resolved.id).toBe('custom');
      expect(resolved.customFormat).toBe('%1H:%Y:%q');
      expect(resolved.customFormatId).toBe('format-aaaa');
    });

    it('names a custom format by the name the user gave it, not "custom"', () => {
      const resolved = resolve({
        isAuthenticated: true,
        defaultExportFormatLabel: 'custom',
        customFormats: SAVED,
      });

      expect(resolved.name).toBe('My Format');
    });

    it('takes the first saved format in array order, not alphabetical order', () => {
      const resolved = resolve({
        isAuthenticated: true,
        defaultExportFormatLabel: 'custom',
        customFormats: [SAVED[1], SAVED[0]],
      });

      expect(resolved.customFormatId).toBe('format-bbbb');
    });
  });

  describe('fallbacks resolve to the discipline default, never a hardcoded format', () => {
    it('falls back silently when the custom default has no saved formats', () => {
      const resolved = resolve({
        isAuthenticated: true,
        defaultExportFormatLabel: 'custom',
        customFormats: [],
        appMode: AppMode.PLANET_SCIENCE,
      });

      expect(resolved.id).toBe('icarus');
      expect(resolved.customFormat).toBeUndefined();
      expect(resolved.customFormatId).toBeUndefined();
    });

    it('falls back to the discipline default for an unrecognised stored label', () => {
      const resolved = resolve({
        isAuthenticated: true,
        defaultExportFormatLabel: 'Not A Real Format',
        appMode: AppMode.ASTROPHYSICS,
      });

      expect(resolved.id).toBe('bibtex');
    });

    it('does not floor a broken preference to AGU when the discipline default differs', () => {
      const resolved = resolve({
        isAuthenticated: true,
        defaultExportFormatLabel: 'custom',
        customFormats: [],
        appMode: AppMode.BIO_PHYSICAL,
      });

      expect(resolved.id).toBe('apsj');
      expect(resolved.id).not.toBe('agu');
    });
  });

  describe('derived flags', () => {
    it.each([
      { label: 'AGU', id: 'agu', asHtml: true },
      { label: 'IEEE', id: 'ieee', asHtml: true },
      { label: 'APS Journals', id: 'apsj', asHtml: true },
      { label: 'BibTeX', id: 'bibtex', asHtml: false },
      { label: 'Icarus', id: 'icarus', asHtml: false },
      { label: 'RIS', id: 'ris', asHtml: false },
    ])('derives asHtml=$asHtml for $label from the manifest type (criterion 9)', ({ label, id, asHtml }) => {
      const resolved = resolve({ isAuthenticated: true, defaultExportFormatLabel: label });

      expect(resolved.id).toBe(id);
      expect(resolved.asHtml).toBe(asHtml);
    });

    it('treats a custom template as plain text', () => {
      const resolved = resolve({
        isAuthenticated: true,
        defaultExportFormatLabel: 'custom',
        customFormats: SAVED,
      });

      expect(resolved.asHtml).toBe(false);
    });

    it.each([
      { label: 'BibTeX', isInModal: true },
      { label: 'AGU', isInModal: true },
      { label: 'Icarus', isInModal: true },
      { label: 'APS Journals', isInModal: false },
      { label: 'GSA', isInModal: false },
    ])('reports isInModal=$isInModal for $label (criteria 5 and 6)', ({ label, isInModal }) => {
      const resolved = resolve({ isAuthenticated: true, defaultExportFormatLabel: label });

      expect(resolved.isInModal).toBe(isInModal);
    });

    it('reports a custom default as outside the modal list', () => {
      const resolved = resolve({
        isAuthenticated: true,
        defaultExportFormatLabel: 'custom',
        customFormats: SAVED,
      });

      expect(resolved.isInModal).toBe(false);
    });
  });

  describe('the discipline map itself', () => {
    it('covers every AppMode', () => {
      const modes = Object.values(AppMode);

      expect(Object.keys(DISCIPLINE_CITATION_DEFAULTS).sort()).toEqual([...modes].sort());
    });

    it('maps BIO_PHYSICAL by its enum value, which is not "BIO_PHYSICAL"', () => {
      expect(AppMode.BIO_PHYSICAL).toBe('BIO_PHYSICAL_SCIENCE');
      expect(DISCIPLINE_CITATION_DEFAULTS['BIO_PHYSICAL_SCIENCE']).toBe('apsj');
    });

    it('only names ids that exist in the export manifest', () => {
      const manifestIds = DEFAULT_EXPORT_FORMATS.map((f) => f.route.substring(1));

      Object.values(DISCIPLINE_CITATION_DEFAULTS).forEach((id) => {
        expect(manifestIds).toContain(id);
      });
    });

    it('names exactly one id outside MostUsedExportFormats, so the deep link stays covered', () => {
      const outside = Object.values(DISCIPLINE_CITATION_DEFAULTS).filter(
        (id) => !MostUsedExportFormats.includes(id as never),
      );

      expect(outside).toEqual(['apsj']);
    });
  });

  describe('a manifest that lacks the resolved format', () => {
    it('falls back to AGU when the discipline default is absent from the manifest', () => {
      const resolved = resolve({
        isAuthenticated: false,
        appMode: AppMode.BIO_PHYSICAL,
        formats: DEFAULT_EXPORT_FORMATS.filter((f) => f.route !== '/apsj'),
      });

      expect(resolved.id).toBe('agu');
      expect(resolved.name).toBe('AGU');
    });

    it('returns the discipline id itself when neither it nor AGU is in the manifest', () => {
      const resolved = resolve({
        isAuthenticated: false,
        appMode: AppMode.BIO_PHYSICAL,
        formats: DEFAULT_EXPORT_FORMATS.filter((f) => f.route !== '/apsj' && f.route !== '/agu'),
      });

      expect(resolved.id).toBe('apsj');
      expect(resolved.name).toBe('apsj');
      expect(resolved.asHtml).toBe(false);
      expect(resolved.isInModal).toBe(false);
    });

    it('does not throw on an empty manifest', () => {
      expect(() => resolve({ isAuthenticated: false, formats: [] })).not.toThrow();
      expect(() => resolve({ isAuthenticated: true, defaultExportFormatLabel: 'BibTeX', formats: [] })).not.toThrow();
    });
  });
});

describe('disciplineCitationFormatId', () => {
  it.each([
    { mode: AppMode.ASTROPHYSICS, id: 'bibtex' },
    { mode: AppMode.HELIOPHYSICS, id: 'agu' },
    { mode: AppMode.PLANET_SCIENCE, id: 'icarus' },
    { mode: AppMode.EARTH_SCIENCE, id: 'agu' },
    { mode: AppMode.GENERAL, id: 'agu' },
    { mode: AppMode.BIO_PHYSICAL, id: 'apsj' },
  ])('maps $mode to $id', ({ mode, id }) => {
    expect(disciplineCitationFormatId(mode)).toBe(id);
  });

  it('accepts the raw cookie string for bio and physical sciences', () => {
    expect(disciplineCitationFormatId('BIO_PHYSICAL_SCIENCE')).toBe('apsj');
  });

  it.each([{ mode: undefined }, { mode: 'CHEMISTRY' }, { mode: 'nonsense' }])(
    'falls back to AGU for $mode',
    ({ mode }) => {
      expect(disciplineCitationFormatId(mode)).toBe('agu');
    },
  );
});

describe('resolveRouteFormat', () => {
  const availableIds = ['bibtex', 'agu', 'icarus', 'apsj', 'custom'];

  it('keeps a route format the manifest knows', () => {
    expect(resolveRouteFormat({ requested: 'icarus', availableIds, fallbackId: 'agu' })).toBe('icarus');
  });

  it.each([
    { label: 'an unknown format', requested: 'nonsense', ids: availableIds, fallbackId: 'apsj' },
    { label: 'a missing format', requested: undefined, ids: availableIds, fallbackId: 'icarus' },
    { label: 'an array of formats', requested: ['agu', 'bibtex'], ids: availableIds, fallbackId: 'icarus' },
    { label: 'an empty manifest', requested: 'bibtex', ids: [], fallbackId: 'agu' },
  ])('falls back to the caller’s id for $label', ({ requested, ids, fallbackId }) => {
    expect(resolveRouteFormat({ requested, availableIds: ids, fallbackId })).toBe(fallbackId);
  });
});

describe('a settings object with fields missing (panel finding 3)', () => {
  it('falls back to the discipline default when customFormats is absent entirely', () => {
    const resolved = resolveCitationFormat({
      isAuthenticated: true,
      defaultExportFormatLabel: 'custom',
      customFormats: undefined as unknown as typeof SAVED,
      appMode: AppMode.PLANET_SCIENCE,
      formats: DEFAULT_EXPORT_FORMATS,
    });

    expect(resolved.id).toBe('icarus');
  });
});
