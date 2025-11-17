import '@tanstack/react-query';

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      skipGlobalErrorHandler?: boolean;
    };
    mutationMeta: {
      skipGlobalErrorHandler?: boolean;
    };
  }
}
