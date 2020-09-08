import React from 'react';
import {
  Collapse,
  makeStyles,
  Theme,
  createStyles,
  Paper,
  Typography,
} from '@material-ui/core';
import { useQuery } from 'react-query';
import axios from 'axios';
import { SearchResult } from '@api/search';
import { Skeleton } from '@material-ui/lab';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      margin: theme.spacing(1),
      padding: theme.spacing(2),
    },
  })
);

const ShowAbstractTray: React.FC<IShowAbstractTrayProps> = ({ id, show }) => {
  const classes = useStyles();
  const { data, refetch, isLoading, isIdle } = useSearch(id);

  React.useEffect(() => {
    if (show && !data) {
      refetch();
    }
  }, [show]);

  const abstract = data?.docs?.[0].abstract;

  return (
    <Collapse in={show}>
      <Paper elevation={4} className={classes.paper}>
        {!isLoading && !abstract && (
          <Typography variant="body2" component="p">
            No abstract
          </Typography>
        )}
        {isLoading ? (
          <>
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </>
        ) : (
          <Typography variant="body2" component="p">
            {abstract}
          </Typography>
        )}
      </Paper>
    </Collapse>
  );
};

export interface IShowAbstractTrayProps {
  id: string;
  show: boolean;
}

export default ShowAbstractTray;

const useSearch = (id: string) => {
  const query = `id:${id}`;
  const fields = 'id,abstract';

  return useQuery(
    [`author_${id}_search`, { query, fields }],
    async (key, { query, fields }) => {
      const { data } = await axios.get<SearchResult>('/api/search', {
        params: { q: query, fl: fields },
      });
      return data;
    },
    { refetchOnWindowFocus: false, retry: false, enabled: false }
  );
};
