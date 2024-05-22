export type ObjectService = {
  payload: {
    query: Array<string>;
  };
  response: {
    query?: string;
    Error?: string;
    'Error Info'?: string;
  };
};

export interface IObjectsQueryApiParams {
  query: string;
}
export interface IObjectsQueryApiResult {
  query?: string;
}

export interface IObjectsApiParams {
  identifiers: string[];
}

export interface IObjectsApiResponse {
  [key: string]: {
    canonical: string;
    id: string;
  };
}
