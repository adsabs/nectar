import axios, { AxiosRequestConfig } from 'axios';

const authenticate = async (config: AxiosRequestConfig) => {
  console.log('config', config.headers.common);
  if (!config.headers.common['Authorization']) {
    const res = await axios.get<AuthPayload>(
      `${process.env.API_HOST}/accounts/bootstrap`
    );

    config.headers.common['Authorization'] = `bearer:${res.data.access_token}`;
  }

  return config;
};

export default authenticate;

export interface AuthPayload {
  username: string;
  scopes?: string[] | null;
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
