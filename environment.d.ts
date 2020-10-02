declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      HOSTNAME: string;
      PORT?: string;
      HOST: string;
      NEXT_PUBLIC_API_HOST: string;
      DEBUG: string;
      COOKIE_SECRET: string;
    }
  }
}

export {};
