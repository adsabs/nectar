import { describe, expect, test } from 'vitest';
import { AppMode } from '@/types';
import { LandingFormPreference } from '@/api/user/types';
import { getLandingFormUrl } from '@/lib/useLandingFormPreference';

describe('getLandingFormUrl', () => {
  describe('non-Astrophysics modes', () => {
    const nonAstroModes = [
      AppMode.GENERAL,
      AppMode.HELIOPHYSICS,
      AppMode.PLANET_SCIENCE,
      AppMode.EARTH_SCIENCE,
      AppMode.BIO_PHYSICAL,
    ];

    test.each(nonAstroModes)('returns "/" for %s mode regardless of preferences', (mode) => {
      const result = getLandingFormUrl({
        isAuthenticated: true,
        userPreference: LandingFormPreference.Classic,
        lastUsedForm: 'paper',
        mode,
      });
      expect(result).toBe('/');
    });
  });

  describe('Astrophysics mode - authenticated users', () => {
    test('returns classic form URL when preference is Classic Form', () => {
      const result = getLandingFormUrl({
        isAuthenticated: true,
        userPreference: LandingFormPreference.Classic,
        lastUsedForm: null,
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/classic-form');
    });

    test('returns paper form URL when preference is Paper Form', () => {
      const result = getLandingFormUrl({
        isAuthenticated: true,
        userPreference: LandingFormPreference.Paper,
        lastUsedForm: null,
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/paper-form');
    });

    test('returns modern form URL when preference is Modern Form', () => {
      const result = getLandingFormUrl({
        isAuthenticated: true,
        userPreference: LandingFormPreference.Modern,
        lastUsedForm: null,
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/');
    });

    test('uses localStorage when preference is Auto', () => {
      const result = getLandingFormUrl({
        isAuthenticated: true,
        userPreference: LandingFormPreference.Auto,
        lastUsedForm: 'classic',
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/classic-form');
    });

    test('falls back to modern form when Auto and no localStorage', () => {
      const result = getLandingFormUrl({
        isAuthenticated: true,
        userPreference: LandingFormPreference.Auto,
        lastUsedForm: null,
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/');
    });
  });

  describe('Astrophysics mode - unauthenticated users', () => {
    test('uses localStorage for last used form', () => {
      const result = getLandingFormUrl({
        isAuthenticated: false,
        userPreference: undefined,
        lastUsedForm: 'paper',
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/paper-form');
    });

    test('falls back to modern form when no localStorage', () => {
      const result = getLandingFormUrl({
        isAuthenticated: false,
        userPreference: undefined,
        lastUsedForm: null,
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/');
    });

    test('ignores user preference when not authenticated', () => {
      const result = getLandingFormUrl({
        isAuthenticated: false,
        userPreference: LandingFormPreference.Classic,
        lastUsedForm: 'paper',
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/paper-form');
    });
  });

  describe('edge cases', () => {
    test('handles undefined userPreference for authenticated user', () => {
      const result = getLandingFormUrl({
        isAuthenticated: true,
        userPreference: undefined,
        lastUsedForm: 'classic',
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/classic-form');
    });

    test('handles invalid userPreference by falling back to localStorage', () => {
      const result = getLandingFormUrl({
        isAuthenticated: true,
        userPreference: 'Invalid Preference' as LandingFormPreference,
        lastUsedForm: 'paper',
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/paper-form');
    });

    test('returns "/" when everything is empty/null', () => {
      const result = getLandingFormUrl({
        isAuthenticated: false,
        userPreference: undefined,
        lastUsedForm: null,
        mode: AppMode.ASTROPHYSICS,
      });
      expect(result).toBe('/');
    });
  });
});
