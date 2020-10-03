import type { DocsEntity } from '@api/search';
import Link from '@components/Link';
import {
  Card,
  CardContent,
  createStyles,
  Grid,
  makeStyles,
  NoSsr,
  Paper,
  Theme,
  Typography,
} from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import React from 'react';
import AuthorList from './AuthorList';
import ResultCheckbox from './ResultCheckbox';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },
    content: {
      padding: 0,
      '&:last-child': {
        paddingBottom: 0,
      },
    },
    selectionContainer: {
      minWidth: '75px',
      paddingRight: theme.spacing(1),
      borderRight: `solid 1px ${theme.palette.divider}`,
    },
    articleContainer: {
      padding: theme.spacing(1),
      flex: 1,
    },

    actions: {
      '& > *': {
        marginLeft: 'auto',
      },
    },
  })
);

const Item: React.FC<IItemProps> = ({ index = 0, articleData }) => {
  const classes = useStyles();

  if (!articleData) {
    return (
      <Card variant="outlined" className={classes.root}>
        <CardContent>
          <Loading />
        </CardContent>
      </Card>
    );
  }

  return (
    <Paper elevation={2} className={classes.root}>
      <Grid container>
        <NoSsr>
          <div className={classes.selectionContainer}>
            <ResultCheckbox id={articleData.id} label={index} />
          </div>
        </NoSsr>
        <Grid item className={classes.articleContainer}>
          <Grid container justify="space-between">
            <Link href={`/abs/${articleData.bibcode}`}>
              <Typography variant="body1">{articleData.bibcode}</Typography>
            </Link>
            <Typography variant="body1">{articleData.pubdate}</Typography>
          </Grid>
          <Link href={`/abs/${articleData.bibcode}`}>
            <Typography variant="h6" component="h3">
              {articleData.title}
            </Typography>
          </Link>
          <Grid container>
            <AuthorList
              authors={articleData.author}
              count={articleData.author_count}
              id={articleData.id}
            />
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

interface IItemProps {
  articleData?: DocsEntity;
  index?: number;
}

export default Item;

const Loading = () => {
  return (
    <>
      <Skeleton variant="rect" height="75" />
      <Skeleton variant="text" />
      <Skeleton variant="text" />
      <Skeleton variant="text" />
    </>
  );
};
