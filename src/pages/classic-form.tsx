import { Box } from '@chakra-ui/layout';
import { ClassicForm, getSearchQuery, IClassicFormState } from '@components/ClassicForm';
import { setupApiSSR } from '@utils';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import Head from 'next/head';

const ClassicFormPage: NextPage<{ ssrError?: string }> = ({ ssrError }) => {
  return (
    <Box as="section" aria-labelledby="form-title" my={16}>
      <Head>
        <title>NASA Science Explorer - Classic Form Search</title>
      </Head>
      <ClassicForm ssrError={ssrError} />
    </Box>
  );
};

/**
 * Takes in raw string and replaces non-word characters with underscores
 * and lowercases entire string
 * @param {string} raw string to be normalized
 * @returns {string} normalized string
 */
// const normalizeString = (raw: string): string => raw.replace(/\W+/g, '_').toLowerCase().trim();

export default ClassicFormPage;

type ReqWithBody = GetServerSidePropsContext['req'] & { body: IClassicFormState };
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  setupApiSSR(ctx);

  if (ctx.req.method == 'POST') {
    const body = (ctx.req as ReqWithBody).body;
    try {
      return Promise.resolve({
        props: {},
        redirect: {
          destination: `/search?${getSearchQuery(body)}`,
          permanent: false,
        },
      });
    } catch (e) {
      return Promise.resolve({
        props: {
          ssrError: { message: (e as Error)?.message },
        },
      });
    }
  }

  return Promise.resolve({ props: {} });
};

// const escape = (val?: string): string => (typeof val === 'string' ? DOMPurify.sanitize(val) : '');
// const listSanitizer = (v: string): string[] =>
//   v.length > 0 ? (Array.from(v.matchAll(/[^\r\n]+/g), head) as string[]) : [];

// const listCheck = pipe(escape, listSanitizer);
// const createQuery = pipe<
//   [PaperFormState[PaperFormType.JOURNAL_QUERY]],
//   Omit<PaperFormState[PaperFormType.JOURNAL_QUERY], 'form'>,
//   [string, string][],
//   string[],
//   string[],
//   string
// >(
//   omit(['form']),
//   toPairs,
//   map(([k, v]) => {
//     const clean = escape(v);
//     return clean.length > 0 ? `${k}:${clean}` : '';
//   }),
//   reject(isEmpty),
//   join(' '),
// );

// const stringifyQuery = (q: string) => {
//   return qs.stringify(
//     {
//       q,
//       sort: ['date desc', 'bibcode desc'],
//       p: 1,
//     },
//     { arrayFormat: 'comma', indices: false, format: 'RFC3986' },
//   );
// };

// const journalQueryNotEmpty = pipe<
//   [PaperFormState[PaperFormType.JOURNAL_QUERY]],
//   Omit<PaperFormState[PaperFormType.JOURNAL_QUERY], 'form'>,
//   string[],
//   boolean
// >(
//   omit(['form']),
//   values,
//   any((v) => v.length > 0),
// );

// const dateSanitizer = (value: string): [number, number] | undefined => {
//   if (value.length === 0) {
//     return undefined;
//   }
//   try {
//     const parts = value.split('/');
//     const year = Math.min(Math.max(parseInt(parts[0]), 0), 9999);
//     const month = Math.min(Math.max(parseInt(parts[1]), 1), 12);
//     if (year === 9999) {
//       return undefined;
//     }
//     return [year, month];
//   } catch (e) {
//     return undefined;
//   }
// };

// const sanitizeString = (value: string) => (typeof value === 'string' ? DOMPurify.sanitize(value) : value);

// const isLimit = (limit: string): limit is CollectionChoice =>
//   allPass([is(String), includes(__, ['astronomy', 'physics', 'general'])])(limit);
// const isLogic = (logic: string): logic is LogicChoice =>
//   allPass([is(String), includes(__, ['all', 'or', 'boolean'])])(logic);
// const isProperty = (property: string): property is PropertyChoice =>
//   allPass([is(String), includes(__, ['all', 'or', 'boolean'])])(property);

// // const escape = (val?: string): string => (typeof val === 'string' ? DOMPurify.sanitize(val) : '');
// // const listSanitizer = (v: string): string[] => (v.length > 0 ? Array.from(v.matchAll(/[^\r\n]+/g), head) : []);
// // const delimSanitizer = (v: string): string[] => (v.length > 0 ? v.split(/[^\w]+/) : []);
// // const formatLogic = (logic: LogicAll | LogicAndOr): string => (logic === 'or' ? ' OR ' : ' ');
// // const emptyOrUndefined = (val?: string | string[]): val is '' | [] => {
// //   return typeof val === 'string' || Array.isArray(val) ? (val.length > 0 ? false : true) : true;
// // };

// const logicJoin = (logic: LogicChoice) => join(logic === 'or' ? ' OR ' : ' ');
// const splitList = split(/[\r\n]/g);
// const parseStringToInt = (_: string) => Number.parseInt(_, 10);

// const parseDate = ifElse(
//   either(isNil, isEmpty),
//   always<null>(null),
//   pipe<[string], string[], number[], number[], number[]>(
//     split('/'),
//     map(parseStringToInt),
//     over(lensIndex(0), pipe<[number], number, number>(clamp(0, 9999), defaultTo(9999))),
//     over(lensIndex(1), pipe<[number], number, number>(clamp(1, 12), defaultTo(0))),
//   ),
// );

// const stringifiers = {
//   limit: pipe<[CollectionChoice[]], string[], string[], string>(
//     filter(isLimit),
//     when<string[], string[]>(isEmpty, always(['astronomy', 'physics', 'general'])),
//     (limit) => `collection:(${logicJoin('or')(limit)})`,
//   ),
//   list: (logic: LogicChoice) =>
//     ifElse(
//       isNil,
//       always(''),
//       pipe<[string], string, string[], string[], string>(
//         sanitizeString,
//         splitList,
//         map(when(test(/[\W]+/), (_) => `"${_}"`)),
//         logicJoin(logic),
//       ),
//     ),
//   date: ifElse<[string[]], string, string>(
//     all<string>(either(isNil, isEmpty)),
//     always(''),
//     pipe<[string[]], [number[], string], [number[], number[]], string>(
//       over<[number[], string], string>(lensIndex(0), pipe<[string], number[], number[]>(parseDate, defaultTo([0, 0]))),

//       over(lensIndex(1), pipe(parseDate, defaultTo([9999, 0]))),
//       ([[yearFrom, monthFrom], [yearTo, monthTo]]) =>
//         `pubdate:[${yearFrom}${monthFrom ? `-${monthFrom}` : ''} TO ${yearTo}${monthTo ? `-${monthTo}` : ''}]`,
//     ),
//   ),

//   // logicAndOrCheck(val: string): LogicAndOr {
//   //   return ['and', 'or'].includes(val) ? (val as LogicAndOr) : 'and';
//   // },
//   // logicAllCheck(val: string): LogicAll {
//   //   return ['and', 'or', 'boolean'].includes(val) ? (val as LogicAll) : 'and';
//   // },
//   // binaryCheck(val?: string): boolean {
//   //   return typeof val === 'string';
//   // },
//   // listCheck: pipe(escape, listSanitizer),
//   // dateCheck: pipe(escape, dateSanitizer),
//   // delimCheck: pipe(escape, delimSanitizer),
// };

// // const cleanParams = (rawParams: IClassicFormState) => {

// // };

// const getSearchQuery = async (params: IClassicFormState, queryClient: QueryClient): Promise<string> => {
//   const query = [
//     stringifiers.limit(params.limit),
//     stringifiers.list(params.logic_author)(params.author),
//     stringifiers.list(params.logic_object)(params.object),
//     stringifiers.date([params.pubdate_start, params.pubdate_end]),
//   ].join(' ');

//   console.log('query', query);

//   return Promise.resolve(JSON.stringify(params));
// };
