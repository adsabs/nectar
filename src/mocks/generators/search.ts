type GenerateOptions = {
  params?: Record<string, string>;
  numFound?: number;
  start?: number;
  innerResponse?: Record<string, unknown>;
};

export const generateSearchResponse = (options: GenerateOptions) => {
  const { params = {}, numFound = 0, start = 0, innerResponse } = options;

  return {
    responseHeader: {
      status: 0,
      QTime: 0,
      params,
    },
    response: {
      numFound,
      start,
      ...options.innerResponse,
    },
  };
};
