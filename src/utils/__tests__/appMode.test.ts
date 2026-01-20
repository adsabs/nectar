import { describe, expect, it } from 'vitest';
import { AppMode } from '@/types';
import { getAppModeLabel, mapDisciplineParamToAppMode, mapPathToDisciplineParam } from '../appMode';

describe('mapDisciplineParamToAppMode', () => {
  it('maps supported disciplines', () => {
    expect(mapDisciplineParamToAppMode('general')).toBe(AppMode.GENERAL);
    expect(mapDisciplineParamToAppMode('astrophysics')).toBe(AppMode.ASTROPHYSICS);
    expect(mapDisciplineParamToAppMode('heliophysics')).toBe(AppMode.HELIOPHYSICS);
    expect(mapDisciplineParamToAppMode('planetary')).toBe(AppMode.PLANET_SCIENCE);
    expect(mapDisciplineParamToAppMode('earth')).toBe(AppMode.EARTH_SCIENCE);
    expect(mapDisciplineParamToAppMode('earthscience')).toBe(AppMode.EARTH_SCIENCE);
    expect(mapDisciplineParamToAppMode('biophysical')).toBe(AppMode.BIO_PHYSICAL);
  });

  it('handles arrays and trimming', () => {
    expect(mapDisciplineParamToAppMode(['planetary'])).toBe(AppMode.PLANET_SCIENCE);
    expect(mapDisciplineParamToAppMode('  earthscience ')).toBe(AppMode.EARTH_SCIENCE);
  });

  it('returns null for unsupported values', () => {
    expect(mapDisciplineParamToAppMode('chemistry')).toBeNull();
    expect(mapDisciplineParamToAppMode('')).toBeNull();
    expect(mapDisciplineParamToAppMode(undefined)).toBeNull();
  });
});

describe('getAppModeLabel', () => {
  it('returns readable labels', () => {
    expect(getAppModeLabel(AppMode.GENERAL)).toBe('No preferred discipline');
    expect(getAppModeLabel(AppMode.ASTROPHYSICS)).toBe('Astrophysics');
    expect(getAppModeLabel(AppMode.HELIOPHYSICS)).toBe('Heliophysics');
    expect(getAppModeLabel(AppMode.PLANET_SCIENCE)).toBe('Planetary Science');
    expect(getAppModeLabel(AppMode.EARTH_SCIENCE)).toBe('Earth Science');
    expect(getAppModeLabel(AppMode.BIO_PHYSICAL)).toBe('Biological & Physical Science');
  });
});

describe('mapPathToDisciplineParam', () => {
  it('returns discipline param for valid paths', () => {
    expect(mapPathToDisciplineParam('/astrophysics')).toBe('astrophysics');
    expect(mapPathToDisciplineParam('/heliophysics')).toBe('heliophysics');
    expect(mapPathToDisciplineParam('/planetary')).toBe('planetary');
    expect(mapPathToDisciplineParam('/earth')).toBe('earth');
    expect(mapPathToDisciplineParam('/biophysical')).toBe('biophysical');
    expect(mapPathToDisciplineParam('/general')).toBe('general');
  });

  it('returns null for invalid paths', () => {
    expect(mapPathToDisciplineParam('/search')).toBeNull();
    expect(mapPathToDisciplineParam('/abs/foobar')).toBeNull();
    expect(mapPathToDisciplineParam('/')).toBeNull();
    expect(mapPathToDisciplineParam('/invalid')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(mapPathToDisciplineParam('/ASTROPHYSICS')).toBe('astrophysics');
    expect(mapPathToDisciplineParam('/Heliophysics')).toBe('heliophysics');
  });
});
