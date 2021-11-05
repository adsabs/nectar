import { AxiosResponse } from 'axios';

export interface IBootstrapPayload {
  username: string;
  scopes: string[];
  client_id: string;
  access_token: string;
  client_name: string;
  token_type: string;
  ratelimit: number;
  anonymous: boolean;
  client_secret: string;
  expire_in: string;
  refresh_token: string;
}

export interface IADSApiBootstrapResponse extends AxiosResponse<IBootstrapPayload> {
  headers: {
    'set-cookie': string;
  };
}

export type IUserData = Pick<IBootstrapPayload, 'username' | 'anonymous' | 'access_token' | 'expire_in'>;
