import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  makeStyles,
  Theme,
  createStyles,
  Grid,
  Divider,
  FormControlLabel,
  Link,
} from '@material-ui/core';
import type { DocsEntity } from '@api/search';
import { Skeleton } from '@material-ui/lab';
import ResultCheckbox from './/ResultCheckbox';
import AuthorList from './AuthorList';
import ShowAbstractButton from './ShowAbstractButton';
import ShowAbstractTray from './ShowAbstractTray';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      margin: '10px 0 10px 0',
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
            <Grid container direction="column" justify="center">
              <FormControlLabel
                control={<ResultCheckbox id={articleData.id} />}
                label={showIndex && index}
                labelPlacement="start"
              />
            </Grid>
          </Grid>

          {/* Article data */}
          <Grid item className={classes.articleContainer}>
            <Grid container direction="column">
              <Grid container justify="space-between" alignItems="center">
                <Typography variant="body1">{articleData.bibcode}</Typography>
                <Typography variant="body1">{articleData.pubdate}</Typography>
                <ShowAbstractButton
                  selected={showAbstract}
                  onChange={setShowAbstract}
                />
              </Grid>
              <Typography variant="h6" color="textPrimary">
                {articleData.title}
              </Typography>
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
