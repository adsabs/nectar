import type { DocsEntity } from '@api/search';
import {
  Card,
  CardActions,
  CardContent,
  createStyles,
  IconButton,
  makeStyles,
  NoSsr,
  Theme,
  useTheme,
} from '@material-ui/core';
import { Favorite } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import React from 'react';
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

const Item: React.FC<IItemProps> = ({
  index = 0,
  showIndex = false,
  articleData,
}) => {
  const classes = useStyles();
  const [showAbstract, setShowAbstract] = React.useState(false);
  const theme = useTheme();

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
    // <Card variant="outlined" className={classes.root}>
    //   <CardContent className={classes.content}>content</CardContent>
    // </Card>

    <Card className={classes.root}>
      <CardContent>
        <NoSsr>
          <div className={classes.selectionContainer}>
            <ResultCheckbox id={articleData.id} label={index} />
          </div>
        </NoSsr>
      </CardContent>
      <CardActions classes={{}} className={classes.actions}>
        <IconButton aria-label="add to favorites">
          <Favorite />
        </IconButton>
      </CardActions>
    </Card>

    // <Card variant="outlined" classes={{ root: classes.root }}>

    //   {/* <Link href={`/abs/${articleData.bibcode}`}>
    //       <Typography variant="body1">{articleData.bibcode}</Typography>
    //     </Link>
    //     <Typography variant="body1">{articleData.pubdate}</Typography>
    //     <ShowAbstractButton
    //       selected={showAbstract}
    //       onChange={setShowAbstract}
    //     /> */}

    //   <CardContent classes={{ root: classes.content }}>

    //   {/* <Grid container>
    //       <AuthorList
    //         id={articleData.id}
    //         authors={articleData.author ?? []}
    //         count={articleData.author_count ?? 0}
    //       />
    //     </Grid> */}
    //     {/* <Grid container wrap="nowrap"> */}
    //       {/* Selection area */}
    //     {/* <NoSsr>
    //         <Grid item className={classes.selectionContainer}>
    //           <Grid container direction="column" justify="center">
    //             <ResultCheckbox id={articleData.id} label={index} />
    //           </Grid>
    //         </Grid>
    //       </NoSsr>

    //       {/* Article data */}
    //     {/* <Grid item className={classes.articleContainer}>
    //         <Grid container direction="column">

    //           <Link href={`/abs/${articleData.bibcode}`}>
    //             {articleData.title}
    //           </Link>
    //           <Grid container>
    //             <AuthorList
    //               id={articleData.id}
    //               authors={articleData.author ?? []}
    //               count={articleData.author_count ?? 0}
    //             />
    //           </Grid>
    //         </Grid> */}
    //     {/* </Grid> */}
    //     {/* </Grid> */}
    //   </CardContent>
    //   <CardActionArea>
    //     test
    //   </CardActionArea>
    //   {/* <ShowAbstractTray show={showAbstract} id={articleData.id} /> */}
    // </Card>
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
