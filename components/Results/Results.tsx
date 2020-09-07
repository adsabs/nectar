import { makeStyles, Theme, createStyles, Paper } from '@material-ui/core';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { queryState, resultState, selectedDocsState } from '@recoil/atoms';
import { useQuery, queryCache } from 'react-query';
import axios from 'axios';
import Item from './Item';
import React from 'react';
import { SearchResult } from '@api/search';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    noResults: {
      padding: theme.spacing(3),
    },
  })
);

const Selected = () => {
  const selectedDocs = useRecoilValue(selectedDocsState);

  return <pre>{JSON.stringify(selectedDocs, null, 2)}</pre>;
};

const Results: React.FC<IResultsProps> = () => {
  const classes = useStyles();
  console.count('render');
  const { data, isSuccess, isError, isLoading } = useSearch();
  const setResultState = useSetRecoilState(resultState);

  if (isSuccess && data) {
    const { docs } = data;

    setResultState(data);

    if (docs.length <= 0) {
      return (
        <Paper elevation={3} className={classes.noResults}>
          No results
        </Paper>
      );
    }

    return (
      <>
        <Selected />
        {docs.map((d, index) => (
          <Item key={d.id} articleData={d} index={index + 1} showIndex={true} />
        ))}
      </>
    );
  }

  if (isError) {
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
  }

  if (isLoading) {
    return (
      <>
        {Array(10)
          .fill(1)
          .map((v, i) => (
            <Item key={i} />
          ))}
      </>
    );
  }

  return null;
};

interface IResultsProps {}

export default Results;

const useSearch = () => {
  const query = useRecoilValue(queryState);
  React.useEffect(() => {
    queryCache.setQueryData('search', { query });
  }, [query]);
  return useQuery(
    ['search', { query }],
    async (key, { query }) => {
      const { data } = await axios.get<SearchResult>('/api/search', {
        params: { q: query, sort: 'author_count desc' },
        withCredentials: true,
      });
      return data;
    },
    { refetchOnWindowFocus: false, retry: 1 }
  );
};
