export interface IValue {
  errors?: unknown[];
  value: string;
  required?: boolean;
  getRequiredMessage?: unknown;
}

export interface OrcidErrorResponse {
  'response-code': number;
  'developer-message': string;
  'user-message': string;
  'error-code': number;
  'more-info': string;
}
