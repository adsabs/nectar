declare module 'next/config' {
  interface AppRuntimeConfig {
    publicRuntimeConfig: {
      apiHost: string;
    };
    serverRuntimeConfig: {
      apiHost: string;
      baseCanonicalUrl: string;
    };
  }
  export default function getConfig(): AppRuntimeConfig;
}
