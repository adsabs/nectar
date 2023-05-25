import { IDocsEntity, useGetAbstract } from '@api';

/**
 * helper hook for getting hold of the primary doc
 */
export const useGetAbstractDoc = (id: string): IDocsEntity => {
  // this *should* only ever fetch from pre-filled cache
  const { data, isSuccess } = useGetAbstract({ id });

  // should be able to access docs here directly
  const doc = isSuccess ? data.docs?.[0] : undefined;

  return doc;
};
