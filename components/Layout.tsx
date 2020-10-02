import NavBar from '@components/NavBar';
import {
  Container,
  createStyles,
  Grid,
  makeStyles,
  Theme,
} from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    main: {
      flexGrow: 1,
    },
  })
);

const Layout: React.FC = ({ children }) => {
  const classes = useStyles();

  return (
    <Grid container direction="column" component="section">
      <Grid item component={NavBar} />
      <Grid item component="main">
        <Container>{children ?? ''}</Container>
      </Grid>
      {/* <Grid item component={Footer} /> */}
    </Grid>
  );
};

export default Layout;
