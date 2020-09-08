import {
  makeStyles,
  Theme,
  createStyles,
  Paper,
  Button,
} from '@material-ui/core';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { flatten, concat, map, prop, reduce, merge } from 'ramda';
import { queryState, resultState, selectedDocsState } from '@recoil/atoms';
import { useQuery, queryCache, useInfiniteQuery } from 'react-query';
import axios from 'axios';
import Item from './Item';
import React from 'react';
import { SearchResult, DocsEntity } from '@api/search';

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
  const { data, isSuccess, isError, isLoading, fetchMore } = useSearch();
  const setResultState = useSetRecoilState(resultState);

  if (isSuccess && data) {
    const flattenedData = flatten(data);
    const docs = reduce<DocsEntity[], DocsEntity[]>(
      concat,
      [],
      map(prop('docs'), flattenedData)
    );

    console.log(flattenedData);

    setResultState(flattenedData[0]);

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
        <Button onClick={() => fetchMore()}>Load More</Button>
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
  const setSelectedDocs = useSetRecoilState(selectedDocsState);

  React.useEffect(() => {
    queryCache.setQueryData('search', { query });
    setSelectedDocs([]);
  }, [query]);
  return useInfiniteQuery(
    ['search', { query }],
    async (key, { query }, nextCursorMark) => {
      const { data } = await axios.get<SearchResult>('/api/search', {
        params: { q: query, c: nextCursorMark },
        withCredentials: true,
      });
      return data;
    },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      getFetchMore: (lastGroup) => {
        return lastGroup.nextCursorMark;
      },
    }
  );
};
