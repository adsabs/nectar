import { describe, expect, it } from 'vitest';
import { AppMode } from '@/types';
import { getAppModeLabel, mapDisciplineParamToAppMode } from '../appMode';

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
    expect(getAppModeLabel(AppMode.GENERAL)).toBe('General Science');
    expect(getAppModeLabel(AppMode.ASTROPHYSICS)).toBe('Astrophysics');
    expect(getAppModeLabel(AppMode.HELIOPHYSICS)).toBe('Heliophysics');
    expect(getAppModeLabel(AppMode.PLANET_SCIENCE)).toBe('Planetary Science');
    expect(getAppModeLabel(AppMode.EARTH_SCIENCE)).toBe('Earth Science');
    expect(getAppModeLabel(AppMode.BIO_PHYSICAL)).toBe('Biological & Physical Science');
  });
});
