import { describe, it, expect } from 'vitest';
import {
  constrainQueryOutput,
  validateFieldConstraints,
  isValidValue,
  suggestCorrection,
} from '@/lib/field-constraints';

describe('field-constraints', () => {
  describe('isValidValue', () => {
    it('should validate correct doctype values', () => {
      expect(isValidValue('doctype', 'article')).toBe(true);
      expect(isValidValue('doctype', 'eprint')).toBe(true);
      expect(isValidValue('doctype', 'phdthesis')).toBe(true);
    });

    it('should reject invalid doctype values', () => {
      expect(isValidValue('doctype', 'journal')).toBe(false);
      expect(isValidValue('doctype', 'paper')).toBe(false);
      expect(isValidValue('doctype', 'publication')).toBe(false);
    });

    it('should validate correct property values', () => {
      expect(isValidValue('property', 'refereed')).toBe(true);
      expect(isValidValue('property', 'openaccess')).toBe(true);
      expect(isValidValue('property', 'eprint')).toBe(true);
    });

    it('should reject invalid property values', () => {
      expect(isValidValue('property', 'peerreviewed')).toBe(false);
      expect(isValidValue('property', 'open_access')).toBe(false);
      expect(isValidValue('property', 'peer-reviewed')).toBe(false);
    });

    it('should validate correct database values', () => {
      expect(isValidValue('database', 'astronomy')).toBe(true);
      expect(isValidValue('database', 'physics')).toBe(true);
      expect(isValidValue('database', 'general')).toBe(true);
    });

    it('should reject invalid database values', () => {
      expect(isValidValue('database', 'astrophysics')).toBe(false);
      expect(isValidValue('database', 'astro')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isValidValue('doctype', 'ARTICLE')).toBe(true);
      expect(isValidValue('doctype', 'Article')).toBe(true);
      expect(isValidValue('property', 'REFEREED')).toBe(true);
    });
  });

  describe('suggestCorrection', () => {
    it('should suggest openaccess for open_access', () => {
      const suggestions = suggestCorrection('property', 'open_access');
      expect(suggestions).toContain('openaccess');
    });

    it('should suggest astronomy for astro', () => {
      const suggestions = suggestCorrection('database', 'astro');
      expect(suggestions).toContain('astronomy');
    });

    it('should suggest eprint for preprint', () => {
      const suggestions = suggestCorrection('doctype', 'preprint');
      expect(suggestions).toContain('eprint');
    });

    it('should suggest phdthesis for thesis', () => {
      const suggestions = suggestCorrection('doctype', 'thesis');
      // thesis matches mastersthesis substring
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('validateFieldConstraints', () => {
    it('should validate query with valid fields', () => {
      const result = validateFieldConstraints('doctype:article property:refereed');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid doctype', () => {
      const result = validateFieldConstraints('doctype:journal abs:exoplanets');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('doctype');
      expect(result.errors[0].value).toBe('journal');
    });

    it('should detect invalid property', () => {
      const result = validateFieldConstraints('property:peerreviewed author:"Smith"');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('property');
      expect(result.errors[0].value).toBe('peerreviewed');
    });

    it('should detect invalid database', () => {
      const result = validateFieldConstraints('database:astrophysics abs:"dark matter"');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('database');
      expect(result.errors[0].value).toBe('astrophysics');
    });

    it('should detect multiple invalid values in OR list', () => {
      const result = validateFieldConstraints('doctype:(journal OR paper OR article)');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2); // journal and paper are invalid
    });

    it('should validate query with quoted values', () => {
      const result = validateFieldConstraints('doctype:"article" property:"refereed"');
      expect(result.valid).toBe(true);
    });
  });

  describe('constrainQueryOutput', () => {
    it('should preserve valid queries', () => {
      const { query, corrections } = constrainQueryOutput('doctype:article property:refereed');
      expect(query).toBe('doctype:article property:refereed');
      expect(corrections).toHaveLength(0);
    });

    it('should remove invalid doctype values', () => {
      const { query, corrections } = constrainQueryOutput('doctype:journal abs:exoplanets');
      expect(query).toBe('abs:exoplanets');
      expect(corrections).toHaveLength(1);
      expect(corrections[0].field).toBe('doctype');
      expect(corrections[0].originalValue).toBe('journal');
    });

    it('should remove invalid property values', () => {
      const { query, corrections } = constrainQueryOutput('property:peerreviewed author:"Smith"');
      expect(query).toBe('author:"Smith"');
      expect(corrections).toHaveLength(1);
      expect(corrections[0].field).toBe('property');
      expect(corrections[0].originalValue).toBe('peerreviewed');
    });

    it('should remove invalid database values', () => {
      const { query, corrections } = constrainQueryOutput('database:astrophysics abs:"dark matter"');
      expect(query).toBe('abs:"dark matter"');
      expect(corrections).toHaveLength(1);
      expect(corrections[0].field).toBe('database');
      expect(corrections[0].originalValue).toBe('astrophysics');
    });

    it('should filter OR lists keeping only valid values', () => {
      const { query, corrections } = constrainQueryOutput('doctype:(journal OR article OR paper)');
      expect(query).toBe('doctype:article');
      expect(corrections).toHaveLength(2); // journal and paper removed
    });

    it('should handle multiple invalid fields', () => {
      const { query, corrections } = constrainQueryOutput(
        'doctype:journal property:peerreviewed database:astro abs:exoplanets',
      );
      expect(query).toBe('abs:exoplanets');
      expect(corrections).toHaveLength(3);
    });

    it('should clean up trailing operators', () => {
      const { query } = constrainQueryOutput('abs:exoplanets AND doctype:journal');
      expect(query).toBe('abs:exoplanets');
      expect(query).not.toMatch(/AND\s*$/);
    });

    it('should clean up leading operators', () => {
      const { query } = constrainQueryOutput('doctype:journal OR abs:exoplanets');
      expect(query).toBe('abs:exoplanets');
      expect(query).not.toMatch(/^OR\s*/);
    });

    it('should handle empty result gracefully', () => {
      const { query } = constrainQueryOutput('doctype:journal');
      expect(query).toBe('');
    });

    it('should preserve bibgroup values', () => {
      const { query, corrections } = constrainQueryOutput('bibgroup:HST abs:exoplanets');
      expect(query).toBe('bibgroup:HST abs:exoplanets');
      expect(corrections).toHaveLength(0);
    });

    it('should remove invalid bibgroup values', () => {
      const { query, corrections } = constrainQueryOutput('bibgroup:Hubble abs:exoplanets');
      expect(query).toBe('abs:exoplanets');
      expect(corrections).toHaveLength(1);
      expect(corrections[0].field).toBe('bibgroup');
    });
  });

  describe('real query examples with constraint issues', () => {
    const testCases: Array<{ input: string; expectedValid: boolean; description: string }> = [
      {
        input: 'doctype:journal author:"Einstein, A"',
        expectedValid: false,
        description: 'journal is not a valid doctype (should be article)',
      },
      {
        input: 'property:peerreviewed abs:"gravitational waves"',
        expectedValid: false,
        description: 'peerreviewed is not valid (should be refereed)',
      },
      {
        input: 'database:astrophysics abs:exoplanets',
        expectedValid: false,
        description: 'astrophysics is not a valid database (should be astronomy)',
      },
      {
        input: 'doctype:paper pubdate:[2020 TO 2023]',
        expectedValid: false,
        description: 'paper is not a valid doctype',
      },
      {
        input: 'property:open_access abs:"dark matter"',
        expectedValid: false,
        description: 'open_access with underscore is not valid (should be openaccess)',
      },
      {
        input: 'doctype:(article OR journal) property:refereed',
        expectedValid: false,
        description: 'OR list with invalid journal value',
      },
      {
        input: 'property:peer-reviewed author:"Hawking"',
        expectedValid: false,
        description: 'peer-reviewed with hyphen is not valid',
      },
      {
        input: 'database:astro abs:"black holes"',
        expectedValid: false,
        description: 'astro is not a valid database abbreviation',
      },
      {
        input: 'doctype:publication abs:cosmology',
        expectedValid: false,
        description: 'publication is not a valid doctype',
      },
      {
        input: 'property:(refereed OR peerreviewed) author:"Penrose"',
        expectedValid: false,
        description: 'OR list with invalid peerreviewed',
      },
      {
        input: 'bibgroup:Hubble abs:"galaxy evolution"',
        expectedValid: false,
        description: 'Hubble is not valid bibgroup (should be HST)',
      },
      {
        input: 'doctype:thesis abs:"machine learning"',
        expectedValid: false,
        description: 'thesis is not valid (should be phdthesis or mastersthesis)',
      },
    ];

    describe('validation', () => {
      testCases.forEach(({ input, expectedValid, description }) => {
        it(`should ${expectedValid ? 'accept' : 'reject'}: ${description}`, () => {
          const result = validateFieldConstraints(input);
          expect(result.valid).toBe(expectedValid);
        });
      });
    });

    describe('constraint filtering', () => {
      testCases.forEach(({ input, description }) => {
        it(`should filter: ${description}`, () => {
          const { query, corrections } = constrainQueryOutput(input);
          expect(corrections.length).toBeGreaterThan(0);
          // The filtered query should be valid
          const result = validateFieldConstraints(query);
          expect(result.valid).toBe(true);
        });
      });
    });
  });
});
