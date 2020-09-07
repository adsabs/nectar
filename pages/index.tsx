import { Grid, makeStyles, Theme, createStyles } from '@material-ui/core';
import SearchBar from '@components/SearchBar';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    search: {
      margin: '10px 0 10px 0',
    },
  })
);

const Home: React.FC = () => {
  const classes = useStyles();

  return (
    <>
      {/* <Grid container direction="column" component="section">
        <Grid container justify="center" className={classes.search}>
          <SearchBar />
        </Grid>
        <Grid item></Grid>
      </Grid> */}
    </>
  );
};

export default Home;
