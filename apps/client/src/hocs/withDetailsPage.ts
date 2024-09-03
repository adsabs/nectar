import { CommonError } from '@server/types';
import { GetServerSideProps } from 'next';

import { IADSApiSearchParams, IDocsEntity } from '@/api';
import { logger } from '@/logger';

export const withDetailsPage: GetServerSideProps<
  { params?: IADSApiSearchParams; doc?: IDocsEntity; error?: CommonError; page: number },
  { id: string }
> = async (ctx) => {
  const page = ctx.query.p ? parseInt(ctx.query.p as string) : 1;
  // Ensure params exist
  if (!ctx.params || !ctx.params.id) {
    logger.warn({ params: ctx.params }, 'Missing or invalid document identifier');
    return {
      props: {
        error: {
          errorMsg: 'Bad Request',
          friendlyMessage: 'Invalid document identifier',
          statusCode: 400,
        },
        page,
      },
    };
  }

  try {
    const { query, doc, error } = await ctx.req.details(ctx.params.id);

    if (doc) {
      logger.info({ docId: ctx.params.id }, 'Document fetched successfully');
      return {
        props: {
          params: query,
          doc,
          page,
        },
      };
    }

    // Handle case where the document is not found but no error was thrown
    if (!doc && !error) {
      logger.warn({ docId: ctx.params.id }, 'Document not found');
      return {
        props: {
          page,
          params: query,
          error: {
            errorMsg: 'Document Not Found',
            friendlyMessage: 'The requested document could not be found',
            statusCode: 404,
          },
        },
      };
    }

    // If there's an error returned, handle it
    logger.error({ error, docId: ctx.params.id }, 'Error fetching details page data');
    return {
      props: {
        page,
        error,
        params: query,
      },
    };
  } catch (err) {
    logger.error({ err, docId: ctx.params.id }, 'Unexpected error occurred during document fetch');
    return {
      props: {
        error: {
          errorMsg: 'Internal Server Error',
          friendlyMessage: 'There was a problem loading details for this record',
          statusCode: 500,
        },
        page,
      },
    };
  }
};
