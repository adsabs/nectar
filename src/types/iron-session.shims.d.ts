declare module 'iron-session' {
  interface IronSessionData {
    token?: {
      access_token: string;
      anonymous: boolean;
      expires_at: string;
      username: string;
    };
    isAuthenticated?: boolean;
    apiCookieHash?: string;
    bot?: boolean;
  }
}
export {};
