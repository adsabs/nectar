import SearchBar from '@components/SearchBar';
import { createStyles, Grid, makeStyles, Theme } from '@material-ui/core';
import Link from 'next/link';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    search: {
      marginTop: theme.spacing(4),
    },
  })
);

const Home: React.FC = () => {
  const classes = useStyles();

  const formProps = {
    action: '/search',
    method: 'get',
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
      console.log('submitting');
    },
  };

  return (
    <>
      <div className="flex items-center justify-between h-16">
        <Link href="/">
          <a className="px-3 py-2 rounded-md text-sm font-medium text-white bg-gray-900 focus:outline-none focus:text-white focus:bg-gray-700">
            Home
          </a>
        </Link>
      </div>

      <Grid container direction="column" component="form" {...formProps}>
        <Grid className={classes.search} component="section">
          <SearchBar />
        </Grid>
      </Grid>
    </>
  );
};

export default Home;
