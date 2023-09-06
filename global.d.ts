import { SetupServerApi } from 'msw/node';

declare module 'vitest' {
  export interface TestContext {
    server?: SetupServerApi;
  }
}

declare module 'iron-session' {
  interface IronSessionData {
    token?: {
      access_token: string;
      anonymous: boolean;
      expire_in: string;
      username: string;
    };
    isAuthenticated?: boolean;
    apiCookieHash?: number[];
  }
}

declare module 'react-device-detect' {
  export function useDeviceSelectors(userAgent: string): DeviceDetectReturns;
  export type DeviceDetectReturns = [Selectors, Data];

  interface Selectors {
    isSmartTV: boolean;
    isConsole: boolean;
    isWearable: boolean;
    isEmbedded: boolean;
    isMobileSafari: boolean;
    isChromium: boolean;
    isMobile: boolean;
    isMobileOnly: boolean;
    isTablet: boolean;
    isBrowser: boolean;
    isDesktop: boolean;
    isAndroid: boolean;
    isWinPhone: boolean;
    isIOS: boolean;
    isChrome: boolean;
    isFirefox: boolean;
    isSafari: boolean;
    isOpera: boolean;
    isIE: boolean;
    osVersion: string;
    osName: string;
    fullBrowserVersion: string;
    browserVersion: string;
    browserName: string;
    mobileVendor: string;
    mobileModel: string;
    engineName: string;
    engineVersion: string;
    getUA: string;
    isEdge: boolean;
    isYandex: boolean;
    deviceType: string;
    isIOS13: boolean;
    isIPad13: boolean;
    isIPhone13: boolean;
    isIPod13: boolean;
    isElectron: boolean;
    isEdgeChromium: boolean;
    isLegacyEdge: boolean;
    isWindows: boolean;
    isMacOs: boolean;
    isMIUI: boolean;
    isSamsungBrowser: boolean;
  }
  interface Data {
    browser: Browser;
    cpu: Cpu;
    device: Device;
    engine: EngineOrOs;
    os: EngineOrOs;
    ua: string;
  }
  interface Browser {
    name: string;
    version: string;
    major: string;
  }
  interface Cpu {
    architecture: string;
  }
  interface EngineOrOs {
    name: string;
    version: string;
  }
  interface Device {
    model: string;
    type: string;
    vendor: string;
  }
}
