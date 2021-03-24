export interface IADSApiBootstrapResponse {
  username: string;
  scopes: string[];
  client_id: string;
  access_token: string;
  client_name: string;
  token_type: string;
  ratelimit: number;
  anonymous: boolean;
  client_secret: string;
  expire_in: Date;
  refresh_token: string;
}

export type IADSApiBootstrapData = Pick<
  IADSApiBootstrapResponse,
  'username' | 'anonymous' | 'access_token' | 'expire_in'
>;
