import type { DocsEntity } from '@api/search';
import {
  Card,
  CardContent,
  createStyles,
  Grid,
  Link,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import React from 'react';
import AuthorList from './AuthorList';
import ResultCheckbox from './ResultCheckbox';
import ShowAbstractButton from './ShowAbstractButton';
import ShowAbstractTray from './ShowAbstractTray';

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
      paddingRight: '10px',
      borderRight: `solid 1px ${theme.palette.divider}`,
      '& > *': {
        height: '100%',
      },
    },
    articleContainer: {
      padding: '10px',
      width: '100%',
    },
  })
);

const Item: React.FC<IItemProps> = ({
  index = 0,
  showIndex = false,
  articleData,
}) => {
  const classes = useStyles();
  const [showAbstract, setShowAbstract] = React.useState(false);

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
    <Card variant="outlined" className={classes.root}>
      <CardContent className={classes.content}>
        <Grid container wrap="nowrap">
          {/* Selection area */}
          <Grid item className={classes.selectionContainer}>
            {/* <Grid container direction="column" justify="center"> */}
            <ResultCheckbox id={articleData.id} label={index} />
            {/* </Grid> */}
          </Grid>

          {/* Article data */}
          <Grid item className={classes.articleContainer}>
            <Grid container direction="column">
              <Grid container justify="space-between" alignItems="center">
                <Link href={`/abs/${articleData.bibcode}`}>
                  <Typography variant="body1">{articleData.bibcode}</Typography>
                </Link>
                <Typography variant="body1">{articleData.pubdate}</Typography>
                <ShowAbstractButton
                  selected={showAbstract}
                  onChange={setShowAbstract}
                />
              </Grid>
              <Link href={`/abs/${articleData.bibcode}`}>
                <Typography variant="h6" color="textPrimary">
                  {articleData.title}
                </Typography>
              </Link>
              <Grid container>
                <AuthorList
                  id={articleData.id}
                  authors={articleData.author ?? []}
                  count={articleData.author_count ?? 0}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
      <ShowAbstractTray show={showAbstract} id={articleData.id} />
    </Card>
  );
};

interface IItemProps {
  articleData?: DocsEntity;
  showIndex?: boolean;
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
