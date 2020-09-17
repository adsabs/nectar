import search, { DocsEntity } from '@api/search';
import Details from '@components/Details';
import {
  createStyles,
  Grid,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';
import { NextPage, NextPageContext } from 'next';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(3),
    },
  })
);

const formProps = {
  action: '/search/query',
  method: 'get',
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  },
};

const DetailsPage: NextPage<DetailsPageProps> = ({ doc }) => {
  const classes = useStyles();

  return (
    <Grid
      container
      direction="column"
      component="form"
      {...formProps}
      className={classes.root}
    >
      <Grid item component="section">
        {doc ? (
          <Details doc={doc} />
        ) : (
          <Typography variant="h3">No record found</Typography>
        )}
      </Grid>
    </Grid>
  );
};

DetailsPage.getInitialProps = async (ctx: NextPageContext) => {
  console.log(ctx);
  try {
    const {
      response: { docs },
    } = await search(ctx, {
      q: `identifier:${ctx.query.id}`,
      fl: [
        'identifier',
        '[citations]',
        'abstract',
        'author',
        'author_count',
        '[fields author=10]',
        'bibcode',
        'citation_count',
        'comment',
        'doi',
        'id',
        'keyword',
        'page',
        'property',
        'pub',
        'pub_raw',
        'pubdate',
        'pubnote',
        'read_count',
        'title',
        'volume',
      ].join(','),
      rows: 1,
    });

    return {
      doc: docs[0],
    };
  } catch (e) {
    return {};
  }
};

interface DetailsPageProps {
  doc?: DocsEntity;
}

export default DetailsPage;
