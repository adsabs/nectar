import { Grid, makeStyles, Theme, createStyles } from '@material-ui/core';
import { NextPageContext, NextPage } from 'next';
import { useSetRecoilState } from 'recoil';
import { queryState } from '@recoil/atoms';
import SearchBar from '@components/SearchBar';
import NumFound from '@components/NumFound';
import Results from '@components/Results';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    search: {
      margin: '50px 0 10px 0',
    },
  })
);

const SearchPage: NextPage<SearchPageProps> = ({ searchQuery }) => {
  const classes = useStyles();
  useSetRecoilState(queryState)(searchQuery);

  return (
    <>
      <Grid container direction="column" component="section">
        <Grid item className={classes.search}>
          <SearchBar />
          {/* <NumFound /> */}
        </Grid>
        <Grid item>
          <Results />
        </Grid>
      </Grid>
    </>
  );
};

SearchPage.getInitialProps = ({ req, query }: NextPageContext) => {
  const searchQuery = Array.isArray(query.q) ? query.q.join('') : query.q ?? '';

  return {
    searchQuery,
  };
};

interface SearchPageProps {
  searchQuery: string;
}

export default SearchPage;
