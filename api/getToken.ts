import axios from 'axios';

const getToken = async () => {
  const res = await axios.get<AuthPayload>(
    `${process.env.API_HOST}/accounts/bootstrap`
  );

  return res.data.access_token;
};

export default getToken;

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
