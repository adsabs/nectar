export interface IOrcidProfile {
  [key: string]: IOrcidProfileEntry;
}

export interface IOrcidProfileSimple {
  [key: string]: IOrcidProfileEntry['status'];
}

export interface IOrcidProfileEntry {
  identifier: string;
  status: Status;
  title: string;
  pubyear: string | null;
  pubmonth: string | null;
  updated: string;
  putcode: string | number;
  source: string[];
}

type Status = 'verified' | 'not in ADS' | 'pending' | 'rejected' | null;
