import { makeStyles, Theme, createStyles } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { queryState } from '@recoil/atoms';
import { useQuery, useQueryCache } from 'react-query';
import axios from 'axios';
import Item from './Item';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
  })
);

const Results: React.FC<IResultsProps> = () => {
  const classes = useStyles();
  const { data, status } = useSearch();

  // if (items.length <= 0) {
  //   return <Paper elevation={3}>No results</Paper>;
  // }

  return (
    <>
      <pre>{JSON.stringify(status)}</pre>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </>
  );
};

interface IResultsProps {}

export default Results;

const useSearch = () => {
  const query = useRecoilValue(queryState);

  return useQuery(
    'search',
    async () => axios.get('/api/search', { params: { q: query } }),
    { refetchOnWindowFocus: false }
  );
};
