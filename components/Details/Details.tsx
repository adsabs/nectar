import React from 'react';
import { DocsEntity } from '@api/search';
import {
  makeStyles,
  Theme,
  createStyles,
  Paper,
  Typography,
  Grid,
} from '@material-ui/core';
import AuthorList from '@components/Results/AuthorList';
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
        <Typography variant="h6">{doc.title}</Typography>
        <Typography variant="body1">{doc.abstract}</Typography>
        <Grid container>
          <AuthorList
            authors={doc.author}
            count={doc.author_count}
            id={doc.id}
            links
          />
        </Grid>
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
