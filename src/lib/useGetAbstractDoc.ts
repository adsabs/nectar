import { IDocsEntity, useGetAbstract } from '@api';

/**
 * helper hook for getting hold of the primary doc
 */
export const useGetAbstractDoc = (id: string): IDocsEntity => {
  // this *should* only ever fetch from pre-filled cache
  const { data } = useGetAbstract({ id });

  return data?.docs?.[0];
};
