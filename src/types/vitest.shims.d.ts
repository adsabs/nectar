declare module 'vitest' {
  export interface TestContext {
    server?: import('msw/node').SetupServerApi;
  }
}
export {};
