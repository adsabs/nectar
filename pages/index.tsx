import SearchBar from '@components/SearchBar';
import { createStyles, Grid, makeStyles, Theme } from '@material-ui/core';
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
      <Grid container direction="column" component="form" {...formProps}>
        <Grid className={classes.search} component="section">
          <SearchBar />
        </Grid>
      </Grid>
    </>
  );
};

export default Home;
