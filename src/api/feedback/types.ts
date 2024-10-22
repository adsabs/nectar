import { ADSQuery } from '@/api/types';

export type FeedbackBaseParams = {
  name: string;
  _subject: 'Updated Record' | 'New Record' | 'Nectar Feedback' | 'Associated Articles' | 'Missing References';
  'g-recaptcha-response': string;
  origin: 'bbb_feedback' | 'user_submission';
  _replyto?: string;
  email?: string;
  'feedback-type'?: string;
  'user-agent-string'?: string;
};
export interface IGeneralFeedbackParams {
  comments: unknown;
  currentuser: string;
  'browser.name'?: string;
  'browser.version'?: string;
  engine?: string;
  platform?: string;
  os?: string;
  current_page?: string;
  current_query?: string;
  url?: string;
}

export type Relationship = 'errata' | 'addenda' | 'series' | 'arxiv' | 'duplicate' | 'other';

export type AssociatedBibcode = {
  value: string;
};

export interface IAssociatedFeedbackParams {
  source: string;
  target: string[];
  relationship: Relationship;
  custom_name?: string;
}

export interface IReferencesFeedbackParams {
  references: {
    citing: string;
    cited: string;
    refstring: string;
  }[];
}

export interface IRecordParams {
  bibcode: string;
  comments: string;
  publication: string;
  pubDate: string;
  title: string;
  abstract: string;
  keywords: string[];
  authors: string[];
  affiliation: string[];
  orcid: string[];
  collection: string[];
  urls: string[];
  references: string[];
}
export interface IRecordFeedbackParams {
  original: IRecordParams;
  new: IRecordParams;
  name: string;
  email: string;
  diff: string;
}

export type IFeedbackParams = FeedbackBaseParams &
  (IGeneralFeedbackParams | IAssociatedFeedbackParams | IReferencesFeedbackParams | IRecordFeedbackParams);

export interface IADSApiFeedbackResponse {
  [key: string]: unknown;
}

export type FeedbackADSQuery<P = IFeedbackParams, R = IADSApiFeedbackResponse> = ADSQuery<
  P,
  IADSApiFeedbackResponse,
  R
>;
