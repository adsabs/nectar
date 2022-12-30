import { exportTypes } from '@components/AuthorAffiliations/models';

/**
 * @example
 * {
 *   bibcode: ["2023SSPMA..53y0311G", "2023NewA..10001975C", "2023NewA..10001974M"],
 *   maxauthor: [3],
 *   numyears: [3]
 * }
 */
export interface IAuthorAffiliationPayload {
  bibcode: string[];
  maxauthor?: number[];
  numyears?: number[];
}

/**
 * @example
 * {
 *   format: "| Lastname, Firstname | Affiliation | Last Active Date | [csv]",
 *   selected: [
 *     "Aguilar, J. A.|Universite Libre de Bruxelles, Science Faculty CP230, B-1050 Brussels, Belgium|2023/03/01",
 *     "Allison, P.|The Ohio State University, Department of Astronomy|2023/03/01"
 *   ]
 * }
 */
export interface IAuthorAffiliationExportPayload {
  format: typeof exportTypes[number];
  selected: string[];
}

export interface IAuthorAffiliationItem {
  authorName: string;
  affiliations: {
    name: string;
    years: string[];
    lastActiveDate: string;
  };
}

export type IAuthorAffiliationResponse = {
  data: IAuthorAffiliationItem[];
  error?: string;
};
