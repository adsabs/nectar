export type BootstrapPayload = {
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
  message?: string;
};

export type CSRFResponse = {
  csrf: string;
};
