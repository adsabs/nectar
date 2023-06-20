// @see: https://github.com/ORCID/orcid-model/blob/f3d98ba117c2b7ef88f30664bc0a8e4b8a533d6f/src/main/resources/record_3.0/samples/write_samples/work-full-3.0.xml

export interface IOrcidWork {
  'put-code'?: string;
  path?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  source?: {
    'source-orcid'?: {
      uri?: string;
      path?: string;
      host?: string;
    };
    'source-client-id'?: {
      uri?: string;
      path?: string;
      host?: string;
    };
    'source-name'?: {
      value?: string;
    };
  };
  title?: {
    title?: {
      value?: string;
    };
    subtitle?: {
      value?: string;
    };
    'translated-title'?: {
      value?: string;
      'language-code'?: string;
    };
  };
  'journal-title'?: {
    value?: string;
  };
  'short-description'?: string;
  citation?: {
    'citation-type'?: string;
    'citation-value'?: string;
  };
  type?: string;
  'publication-date'?: {
    year?: {
      value?: string;
    };
    month?: {
      value?: string;
    };
    day?: {
      value?: string;
    };
    'media-type'?: string;
  };
  url?: {
    value?: string;
  };
  contributors?: {
    contributor?: Contributor[];
  };
  'external-ids'?: {
    'external-id'?: ExternalID[];
  };
  country?: {
    value?: string;
  };
  visibility?: {
    value?: string;
  };
  identifier?: string[];
}

export type Contributor = {
  'contributor-orcid'?: {
    uri?: string;
    path?: string;
    host?: string;
  };
  'credit-name'?: {
    value?: string;
  };
  'contributor-email'?: {
    value?: string;
  };
  'contributor-attributes'?: {
    'contributor-sequence'?: string;
    'contributor-role'?: string;
  };
};

export type ExternalID = {
  'external-id-value'?: string;
  'external-id-type'?: string;
  'external-id-url'?: string;
  'external-id-relationship'?: string;
};
