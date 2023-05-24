export interface IOrcidProfile {
  [key: string]: IOrcidProfileEntry;
}

export interface IOrcidProfileEntry {
  identifier: string;
  status: Status;
  title: string;
  pubyear: string;
  pubmonth: string;
  updated: string;
  putcode: string | number;
  source: string[];
}

type Status = 'verified' | 'not in ADS' | 'pending' | 'rejected' | null;
