import { render } from '@/test-utils';
import { describe, test, expect, vi } from 'vitest';
import { Metatags } from '../Metatags';
import { IDocsEntity, Esources } from '@/api/search/types';

vi.mock('next/config', () => ({
  default: () => ({
    serverRuntimeConfig: {
      baseCanonicalUrl: 'https://scixplorer.org',
    },
  }),
}));

const createMockDoc = (overrides: Partial<IDocsEntity> = {}): IDocsEntity => ({
  bibcode: '2014ApJ...788..106L',
  title: ['Test Article Title'],
  abstract: 'This is a test abstract describing the content of the paper.',
  author: ['Lin, He', 'Wu, Zheng', 'Chen, Ming'],
  aff: [
    'Department of Physics, University A',
    'Institute of Research, University B',
    'School of Science, University C',
  ],
  pubdate: '2014-04-15',
  pub: 'The Astrophysical Journal',
  pub_raw: 'The Astrophysical Journal, vol. 788, issue 2, pp. 106-120',
  volume: '788',
  issue: '2',
  page: '106',
  page_range: '106-120',
  doi: ['10.1088/0004-637X/788/2/106'],
  issn: ['0004-637X'],
  keyword: ['galaxies', 'evolution', 'cosmology'],
  doctype: 'article',
  bibstem: ['ApJ'],
  identifier: ['2014ApJ...788..106L', 'arXiv:1403.1234', '10.1088/0004-637X/788/2/106'],
  esources: [Esources.PUB_PDF],
  ...overrides,
});

describe('Metatags Component', () => {
  describe('Basic Rendering', () => {
    test('renders without crashing with valid doc', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);
      expect(container).toBeTruthy();
    });

    test('returns null for undefined doc', () => {
      const { container } = render(<Metatags doc={null as unknown as IDocsEntity} />);
      const metaTags = container.querySelectorAll('meta');
      const links = container.querySelectorAll('link');
      const scripts = container.querySelectorAll('script');
      expect(metaTags.length + links.length + scripts.length).toBe(0);
    });
  });

  describe('Author-Institution Pairing', () => {
    test('renders citation_author tags (singular) for each author', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const authorTags = container.querySelectorAll('meta[name="citation_author"]');
      expect(authorTags).toHaveLength(3);
      expect(authorTags[0].getAttribute('content')).toBe('Lin, He');
      expect(authorTags[1].getAttribute('content')).toBe('Wu, Zheng');
      expect(authorTags[2].getAttribute('content')).toBe('Chen, Ming');
    });

    test('pairs each author with their corresponding institution', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const authorTags = Array.from(container.querySelectorAll('meta[name="citation_author"]'));
      const institutionTags = Array.from(container.querySelectorAll('meta[name="citation_author_institution"]'));

      expect(authorTags).toHaveLength(3);
      expect(institutionTags).toHaveLength(3);

      expect(institutionTags[0].getAttribute('content')).toBe('Department of Physics, University A');
      expect(institutionTags[1].getAttribute('content')).toBe('Institute of Research, University B');
      expect(institutionTags[2].getAttribute('content')).toBe('School of Science, University C');
    });

    test('handles authors without affiliations gracefully', () => {
      const doc = createMockDoc({
        author: ['Author One', 'Author Two', 'Author Three'],
        aff: ['Institution One'],
      });
      const { container } = render(<Metatags doc={doc} />);

      const authorTags = container.querySelectorAll('meta[name="citation_author"]');
      const institutionTags = container.querySelectorAll('meta[name="citation_author_institution"]');

      expect(authorTags).toHaveLength(3);
      expect(institutionTags).toHaveLength(1);
    });

    test('limits authors to 50', () => {
      const manyAuthors = Array.from({ length: 100 }, (_, i) => `Author ${i + 1}`);
      const doc = createMockDoc({ author: manyAuthors, aff: [] });
      const { container } = render(<Metatags doc={doc} />);

      const authorTags = container.querySelectorAll('meta[name="citation_author"]');
      expect(authorTags).toHaveLength(50);
    });

    test('does not render citation_authors (plural) tag', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const oldAuthorTags = container.querySelectorAll('meta[name="citation_authors"]');
      expect(oldAuthorTags).toHaveLength(0);
    });
  });

  describe('Date Format - Citation Standard (MM/YYYY)', () => {
    test('formats citation_date as MM/YYYY', () => {
      const doc = createMockDoc({ pubdate: '2014-04-15' });
      const { container } = render(<Metatags doc={doc} />);

      const citationDateTags = container.querySelectorAll('meta[name="citation_date"]');
      citationDateTags.forEach((tag) => {
        expect(tag.getAttribute('content')).toBe('04/2014');
      });
    });

    test('formats citation_publication_date as MM/YYYY', () => {
      const doc = createMockDoc({ pubdate: '2014-04-15' });
      const { container } = render(<Metatags doc={doc} />);

      const publicationDateTag = container.querySelector('meta[name="citation_publication_date"]');
      expect(publicationDateTag?.getAttribute('content')).toBe('04/2014');
    });

    test('handles year-only date (month is 00)', () => {
      const doc = createMockDoc({ pubdate: '2014-00-00' });
      const { container } = render(<Metatags doc={doc} />);

      const citationDateTag = container.querySelector('meta[name="citation_date"]');
      expect(citationDateTag?.getAttribute('content')).toBe('2014');
    });

    test('formats various months correctly', () => {
      const testCases = [
        { pubdate: '2020-01-15', expected: '01/2020' },
        { pubdate: '2020-12-31', expected: '12/2020' },
        { pubdate: '2021-06-01', expected: '06/2021' },
      ];

      testCases.forEach(({ pubdate, expected }) => {
        const doc = createMockDoc({ pubdate });
        const { container } = render(<Metatags doc={doc} />);
        const citationDateTag = container.querySelector('meta[name="citation_date"]');
        expect(citationDateTag?.getAttribute('content')).toBe(expected);
      });
    });
  });

  describe('Highwire Press Compliance', () => {
    test('all citation_* tags have data-highwire="true"', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const citationTags = container.querySelectorAll('meta[name^="citation_"]');
      expect(citationTags.length).toBeGreaterThan(0);

      citationTags.forEach((tag) => {
        expect(tag.getAttribute('data-highwire')).toBe('true');
      });
    });

    test('all og:* tags have data-highwire="true"', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const ogTags = container.querySelectorAll('meta[property^="og:"]');
      expect(ogTags.length).toBeGreaterThan(0);

      ogTags.forEach((tag) => {
        expect(tag.getAttribute('data-highwire')).toBe('true');
      });
    });

    test('all twitter:* tags have data-highwire="true"', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const twitterTags = container.querySelectorAll('meta[name^="twitter:"]');
      expect(twitterTags.length).toBeGreaterThan(0);

      twitterTags.forEach((tag) => {
        expect(tag.getAttribute('data-highwire')).toBe('true');
      });
    });
  });

  describe('Individual Keywords', () => {
    test('renders individual keyword tags', () => {
      const doc = createMockDoc({ keyword: ['galaxies', 'evolution', 'cosmology'] });
      const { container } = render(<Metatags doc={doc} />);

      const keywordTags = container.querySelectorAll('meta[name="citation_keywords"]');
      expect(keywordTags.length).toBeGreaterThan(0);

      const individualKeywords = Array.from(keywordTags).filter((tag) => tag.getAttribute('data-highwire') === 'true');

      expect(individualKeywords).toHaveLength(3);
      expect(individualKeywords[0].getAttribute('content')).toBe('galaxies');
      expect(individualKeywords[1].getAttribute('content')).toBe('evolution');
      expect(individualKeywords[2].getAttribute('content')).toBe('cosmology');
    });

    test('each keyword tag has data-highwire="true"', () => {
      const doc = createMockDoc({ keyword: ['test1', 'test2'] });
      const { container } = render(<Metatags doc={doc} />);

      const keywordTags = container.querySelectorAll('meta[name="citation_keywords"][data-highwire="true"]');
      expect(keywordTags.length).toBe(2);
    });

    test('handles empty keyword array', () => {
      const doc = createMockDoc({ keyword: [] });
      const { container } = render(<Metatags doc={doc} />);

      const keywordTags = container.querySelectorAll('meta[name="citation_keywords"]');
      expect(keywordTags).toHaveLength(0);
    });
  });

  describe('Twitter Card Type', () => {
    test('uses "summary" card type instead of "summary_large_image"', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const twitterCardTag = container.querySelector('meta[name="twitter:card"]');
      expect(twitterCardTag?.getAttribute('content')).toBe('summary');
      expect(twitterCardTag?.getAttribute('content')).not.toBe('summary_large_image');
    });
  });

  describe('Journal Title with pub_raw', () => {
    test('uses pub_raw for citation_journal_title when available', () => {
      const doc = createMockDoc({
        pub: 'The Astrophysical Journal',
        pub_raw: 'The Astrophysical Journal, vol. 788, issue 2, pp. 106-120',
      });
      const { container } = render(<Metatags doc={doc} />);

      const journalTag = container.querySelector('meta[name="citation_journal_title"]');
      expect(journalTag?.getAttribute('content')).toBe('The Astrophysical Journal, vol. 788, issue 2, pp. 106-120');
    });

    test('falls back to pub when pub_raw is not available', () => {
      const doc = createMockDoc({
        pub: 'The Astrophysical Journal',
        pub_raw: undefined,
      });
      const { container } = render(<Metatags doc={doc} />);

      const journalTag = container.querySelector('meta[name="citation_journal_title"]');
      expect(journalTag?.getAttribute('content')).toBe('The Astrophysical Journal');
    });

    test('renders nothing when neither pub nor pub_raw available', () => {
      const doc = createMockDoc({
        pub: undefined,
        pub_raw: undefined,
        doctype: 'article',
      });
      const { container } = render(<Metatags doc={doc} />);

      const journalTag = container.querySelector('meta[name="citation_journal_title"]');
      expect(journalTag).toBeNull();
    });
  });

  describe('Complete Metadata Coverage', () => {
    test('renders all required OpenGraph tags', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      expect(container.querySelector('meta[property="og:type"]')).toBeTruthy();
      expect(container.querySelector('meta[property="og:title"]')).toBeTruthy();
      expect(container.querySelector('meta[property="og:site_name"]')).toBeTruthy();
      expect(container.querySelector('meta[property="og:description"]')).toBeTruthy();
      expect(container.querySelector('meta[property="og:url"]')).toBeTruthy();
      expect(container.querySelector('meta[property="og:image"]')).toBeTruthy();
    });

    test('renders all required citation tags', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      expect(container.querySelector('meta[name="citation_journal_title"]')).toBeTruthy();
      expect(container.querySelector('meta[name="citation_date"]')).toBeTruthy();
      expect(container.querySelector('meta[name="citation_author"]')).toBeTruthy();
      expect(container.querySelector('meta[name="citation_title"]')).toBeTruthy();
      expect(container.querySelector('meta[name="citation_volume"]')).toBeTruthy();
      expect(container.querySelector('meta[name="citation_issue"]')).toBeTruthy();
      expect(container.querySelector('meta[name="citation_firstpage"]')).toBeTruthy();
      expect(container.querySelector('meta[name="citation_doi"]')).toBeTruthy();
    });

    test('renders PRISM schema tags', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      expect(container.querySelector('meta[name="prism.publicationDate"]')).toBeTruthy();
      expect(container.querySelector('meta[name="prism.publicationName"]')).toBeTruthy();
      expect(container.querySelector('meta[name="prism.volume"]')).toBeTruthy();
      expect(container.querySelector('meta[name="prism.startingPage"]')).toBeTruthy();
    });

    test('renders Dublin Core tags', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      expect(container.querySelector('meta[name="dc.identifier"]')).toBeTruthy();
      expect(container.querySelector('meta[name="dc.date"]')).toBeTruthy();
      expect(container.querySelector('meta[name="dc.title"]')).toBeTruthy();
      expect(container.querySelector('meta[name="dc.creator"]')).toBeTruthy();
    });

    test('renders all Twitter Card tags', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      expect(container.querySelector('meta[name="twitter:card"]')).toBeTruthy();
      expect(container.querySelector('meta[name="twitter:description"]')).toBeTruthy();
      expect(container.querySelector('meta[name="twitter:title"]')).toBeTruthy();
      expect(container.querySelector('meta[name="twitter:site"]')).toBeTruthy();
      expect(container.querySelector('meta[name="twitter:domain"]')).toBeTruthy();
      expect(container.querySelector('meta[name="twitter:image:src"]')).toBeTruthy();
      expect(container.querySelector('meta[name="twitter:creator"]')).toBeTruthy();
    });

    test('renders JSON-LD structured data', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const jsonLdScript = container.querySelector('script[type="application/ld+json"]');
      expect(jsonLdScript).toBeTruthy();
      expect(jsonLdScript?.innerHTML).toBeTruthy();
    });

    test('renders canonical link', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const canonicalLink = container.querySelector('link[rel="canonical"]');
      expect(canonicalLink).toBeTruthy();
      expect(canonicalLink?.getAttribute('href')).toContain('/abs/2014ApJ...788..106L/abstract');
    });
  });

  describe('Edge Cases', () => {
    test('handles PhD Thesis doctype', () => {
      const doc = createMockDoc({ doctype: 'PhD Thesis' });
      const { container } = render(<Metatags doc={doc} />);

      const dissertationTag = container.querySelector('meta[name="citation_dissertation_name"]');
      expect(dissertationTag?.getAttribute('content')).toBe('Phd');
    });

    test('handles Masters Thesis doctype', () => {
      const doc = createMockDoc({ doctype: 'Masters Thesis' });
      const { container } = render(<Metatags doc={doc} />);

      const dissertationTag = container.querySelector('meta[name="citation_dissertation_name"]');
      expect(dissertationTag?.getAttribute('content')).toBe('MS');
    });

    test('handles Proceedings doctype with conference tag', () => {
      const doc = createMockDoc({
        doctype: 'Proceedings',
        bibstem: ['SPIE'],
        pub: undefined,
      });
      const { container } = render(<Metatags doc={doc} />);

      const conferenceTag = container.querySelector('meta[name="citation_conference"]');
      expect(conferenceTag?.getAttribute('content')).toBe('SPIE');
    });

    test('handles arXiv identifier', () => {
      const doc = createMockDoc({
        identifier: ['2014ApJ...788..106L', 'arXiv:1403.1234', '10.1088/0004-637X/788/2/106'],
      });
      const { container } = render(<Metatags doc={doc} />);

      const arxivTag = container.querySelector('meta[name="citation_arxiv_id"]');
      expect(arxivTag?.getAttribute('content')).toBe('arXiv:1403.1234');
    });

    test('handles PDF esource', () => {
      const doc = createMockDoc({ esources: [Esources.PUB_PDF] });
      const { container } = render(<Metatags doc={doc} />);

      const pdfTag = container.querySelector('meta[name="citation_pdf_url"]');
      expect(pdfTag?.getAttribute('content')).toContain('/link_gateway/');
      expect(pdfTag?.getAttribute('content')).toContain('/PUB_PDF');
    });

    test('handles multiple titles as semicolon-separated', () => {
      const doc = createMockDoc({ title: ['Title One', 'Title Two'] });
      const { container } = render(<Metatags doc={doc} />);

      const titleTag = container.querySelector('meta[name="citation_title"]');
      expect(titleTag?.getAttribute('content')).toBe('Title One; Title Two');
    });
  });

  describe('Metadata Count Validation', () => {
    test('generates at least 23 meta tags (matching ADS coverage)', () => {
      const doc = createMockDoc();
      const { container } = render(<Metatags doc={doc} />);

      const allMetaTags = container.querySelectorAll('meta');
      expect(allMetaTags.length).toBeGreaterThanOrEqual(23);
    });
  });

  describe('HTML Stripping', () => {
    test('strips HTML tags from title in meta tags', () => {
      const doc = createMockDoc({
        title: ['Observation of Λ Hyperon Polarization at √<sub>s<sub>NN</sub></sub>=8.16 TeV'],
      });
      const { container } = render(<Metatags doc={doc} />);

      const ogTitle = container.querySelector('meta[property="og:title"]');
      const twitterTitle = container.querySelector('meta[name="twitter:title"]');
      const citationTitle = container.querySelector('meta[name="citation_title"]');
      const dcTitle = container.querySelector('meta[name="dc.title"]');

      const expectedPlainText = 'Observation of Λ Hyperon Polarization at √sNN=8.16 TeV';

      expect(ogTitle?.getAttribute('content')).toBe(expectedPlainText);
      expect(twitterTitle?.getAttribute('content')).toBe(expectedPlainText);
      expect(citationTitle?.getAttribute('content')).toBe(expectedPlainText);
      expect(dcTitle?.getAttribute('content')).toBe(expectedPlainText);
    });

    test('strips sup and sub tags from title', () => {
      const doc = createMockDoc({
        title: ['H<sub>2</sub>O and CO<sub>2</sub> in the <sup>13</sup>C isotope'],
      });
      const { container } = render(<Metatags doc={doc} />);

      const citationTitle = container.querySelector('meta[name="citation_title"]');
      expect(citationTitle?.getAttribute('content')).toBe('H2O and CO2 in the 13C isotope');
    });

    test('strips italic and bold tags from title', () => {
      const doc = createMockDoc({
        title: ['Study of <i>Drosophila melanogaster</i> and <b>key findings</b>'],
      });
      const { container } = render(<Metatags doc={doc} />);

      const citationTitle = container.querySelector('meta[name="citation_title"]');
      expect(citationTitle?.getAttribute('content')).toBe('Study of Drosophila melanogaster and key findings');
    });
  });
});
