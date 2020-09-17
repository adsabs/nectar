import search, { SearchResult } from '@api/search';
import NumFound from '@components/NumFound';
import Results from '@components/Results';
import SearchBar from '@components/SearchBar';
import { createStyles, Grid, makeStyles, Theme } from '@material-ui/core';
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    search: {
      marginTop: theme.spacing(4),
    },
  })
);

const SearchPage: NextPage<SearchPageProps> = ({
  searchQuery,
  sort,
  searchResult,
}) => {
  const classes = useStyles();

  const formProps = {
    action: '/search/query',
    method: 'get',
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
      // e.preventDefault();
    },
  };

  return (
    <Grid container direction="column" component="form" {...formProps}>
      <Grid item className={classes.search} component="section">
        <SearchBar query={searchQuery} />
        <NumFound numFound={searchResult.numFound} />
      </Grid>
      <Grid item>
        <Results docs={searchResult.docs} />
      </Grid>
    </Grid>
  );
};

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async (
  ctx: GetServerSidePropsContext
) => {
  try {
    const {
      response: { numFound, docs },
      responseHeader: {
        params: { q, sort },
      },
    } = await search(ctx);

    return {
      props: {
        searchQuery: q,
        sort,
        searchResult: {
          numFound,
          docs,
        },
      },
    };
  } catch (e) {
    return {
      props: {
        searchQuery: '',
        sort: '',
        searchResult: {
          numFound: 0,
          docs: [],
        },
      },
    };
  }
};

interface SearchPageProps {
  searchQuery: string;
  sort: string;
  searchResult: Omit<SearchResult, 'start'>;
}

export default SearchPage;
