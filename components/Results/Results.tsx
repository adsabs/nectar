import { DocsEntity } from '@api/search';
import {
  createStyles,
  makeStyles,
  Paper,
  Theme,
  Typography,
} from '@material-ui/core';
import React from 'react';
import Item from './Item';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(2),
    },
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
      <>
        <Typography variant="srOnly" component="h2">
          Results
        </Typography>
        <Paper elevation={3} className={classes.noResults}>
          No results
        </Paper>
      </>
    );
  }

  return (
    <article className={classes.root}>
      <Typography variant="srOnly" component="h2">
        Results
      </Typography>
      {docs.map((d, index) => (
        <Item key={d.id} articleData={d} index={index + 1} />
      ))}
    </article>
  );
};

interface IResultsProps {
  docs: DocsEntity[];
}

export default Results;
