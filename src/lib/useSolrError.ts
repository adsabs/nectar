type SolrErrorResponse = {
  code: number;
  metadata: Array<string>;
  msg: string;
};

export enum SOLR_ERROR {
  FIELD_NOT_FOUND,
  SYNTAX_ERROR,
  UNKNOWN,
}

const isSolrErrorResponse = (error: unknown): error is SolrErrorResponse => {
  return typeof error === 'object' && error !== null && 'code' in error && 'metadata' in error && 'msg' in error;
};

export const useSolrError = (error: unknown) => {
  if (!isSolrErrorResponse(error)) {
    return { error: SOLR_ERROR.UNKNOWN };
  }

  if (error.code !== 400) {
    return { error: SOLR_ERROR.UNKNOWN };
  }

  if (error.msg.includes('undefined field')) {
    return {
      error: SOLR_ERROR.FIELD_NOT_FOUND,
      field: error.msg.split('undefined field ')[1],
    };
  }

  if (error.msg.includes('Syntax Error, cannot parse')) {
    return {
      error: SOLR_ERROR.SYNTAX_ERROR,
    };
  }

  return {
    error: SOLR_ERROR.UNKNOWN,
  };
};
