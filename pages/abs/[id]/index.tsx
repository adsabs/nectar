import search, { DocsEntity } from '@api/search';
import Details from '@components/Details';
import ActionsButtons from '@components/Details/ActionButtons';
import GoBackButton from '@components/GoBackButton';
import {
  createStyles,
  Grid,
  makeStyles,
  Theme,
  Typography,
} from '@material-ui/core';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import Head from 'next/head';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(1),
      '& > *': {
        margin: `${theme.spacing(1)}px ${theme.spacing(1)}px`,
      },
    },
    detailsActions: {
      marginBottom: theme.spacing(1),
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
    <>
      <Head>{doc && <title>{doc.title}</title>}</Head>
      <Grid
        container
        direction="column"
        component="form"
        {...formProps}
        className={classes.root}
      >
        <Grid item className={classes.detailsActions}>
          <GoBackButton />
        </Grid>
        <Grid item component="section">
          {doc ? (
            <Details doc={doc} />
          ) : (
            <Typography variant="h3">No record found</Typography>
          )}
        </Grid>
        {doc && <ActionsButtons id={doc.id} />}
      </Grid>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<DetailsPageProps> = async (
  ctx: GetServerSidePropsContext
) => {
  console.log(ctx);
  try {
    const {
      response: { docs },
    } = await search({
      searchParams: {
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
      },
      ctx,
    });

    return {
      props: {
        doc: docs[0],
      },
    };
  } catch (e) {
    return {
      props: { doc: undefined },
    };
  }
};

interface DetailsPageProps {
  doc?: DocsEntity;
}

export default DetailsPage;
