import {
  Typography,
  Grid,
  createStyles,
  makeStyles,
  Theme,
} from '@material-ui/core';
import Copyright from '@components/Copyright';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      backgroundColor: '#484f4f',
    },
  })
);

const Footer: React.FC = () => {
  const classes = useStyles();
  return (
    <Grid
      container
      className={classes.root}
      component="footer"
      spacing={0}
      justify="space-around"
    >
      <Grid item>
        <Copyright />
      </Grid>
      <Grid item>test</Grid>
      <Grid item>test</Grid>
    </Grid>
  );
};

export default Footer;
