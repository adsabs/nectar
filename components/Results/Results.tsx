import { DocsEntity } from '@api/search';
import { createStyles, makeStyles, Paper, Theme } from '@material-ui/core';
import React from 'react';
import Item from './Item';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    noResults: {
      marginTop: theme.spacing(3),
      padding: theme.spacing(3),
    },
  })
);

const Results: React.FC<IResultsProps> = ({ docs }) => {
  const classes = useStyles();

  if (docs.length <= 0) {
    return (
      <Paper elevation={3} className={classes.noResults}>
        No results
      </Paper>
    );
  }

  return (
    <>
      {docs.map((d, index) => (
        <Item key={d.id} articleData={d} index={index + 1} showIndex={true} />
      ))}
    </>
  );
};

interface IResultsProps {
  docs: DocsEntity[];
}

export default Results;

// const useSearch = () => {
//   const query = useRecoilValue(queryState);
//   const setSelectedDocs = useSetRecoilState(selectedDocsState);

//   React.useEffect(() => {
//     queryCache.setQueryData('search', { query });
//     setSelectedDocs([]);
//   }, [query]);
//   return useInfiniteQuery(
//     ['search', { query }],
//     async (key, { query }, nextCursorMark) => {
//       const { data } = await axios.get<SearchResult>('/api/search', {
//         params: { q: query, c: nextCursorMark },
//         withCredentials: true,
//       });
//       return data;
//     },
//     {
//       refetchOnWindowFocus: false,
//       retry: 1,
//       getFetchMore: (lastGroup) => {
//         return lastGroup.nextCursorMark;
//       },
//     }
//   );
// };
