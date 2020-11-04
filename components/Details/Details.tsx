import { DocsEntity } from '@api/search';
import AuthorList from '@components/results/AuthorList';
import {
  createStyles,
  makeStyles,
  Paper,
  Theme,
  Typography,
} from '@material-ui/core';
import React from 'react';
import AttributeList from './AttributeList';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(3),
      '& > *': {
        marginBottom: theme.spacing(2),
      },
    },
  })
);

const Details: React.FC<IDetailsProps> = React.memo(
  ({ doc }) => {
    const classes = useStyles();

    if (!doc) {
      return (
        <Paper className={classes.root} elevation={3}>
          <Typography variant="h3">Not Found</Typography>
        </Paper>
      );
    }

    return (
      <Paper className={classes.root} elevation={3}>
        <Typography variant="h6" component="h2">
          {doc.title}
        </Typography>

        <Typography variant="srOnly" component="h3">
          Abstract
        </Typography>
        <Typography variant="body1">{doc.abstract}</Typography>

        <Typography variant="srOnly" component="h3">
          Authors
        </Typography>
        <AuthorList
          authors={doc.author}
          count={doc.author_count}
          links
          canShowAll
          id={doc.id}
        />

        <Typography variant="srOnly" component="h3">
          Article Attributes
        </Typography>
        <AttributeList doc={doc} />
      </Paper>
    );
  },
  (prev, next) => prev.doc.id === next.doc.id
);

interface IDetailsProps {
  doc: DocsEntity;
}

export default Details;
