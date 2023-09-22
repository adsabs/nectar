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

export interface IObjectsApiParams {
  query: string;
}
export interface IObjectsApiResult {
  query?: string;
}
