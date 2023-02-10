export interface IADSApiTokenResponse {
  username: string;
  scopes: string[];
  user_id: string;
  client_id: string;
  access_token: string;
  token_type: string;
  anonymous: boolean;
  expire_in: string;
  refresh_token: string;
}
