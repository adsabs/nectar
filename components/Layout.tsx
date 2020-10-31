import NavBar from '@components/NavBar';
import {
  Container,
  createStyles,
  Grid,
  makeStyles,
  Theme,
} from '@material-ui/core';
import { useRouter } from 'next/router';
import LandingHero from './LandingHero';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    main: {
      flexGrow: 1,
    },
  })
);

const Layout: React.FC = ({ children }) => {
  const classes = useStyles();
  const router = useRouter();
  const showHero = ['/', '/classic-form', '/paper-form'].includes(
    router.asPath
  );

  return (
    <Grid container direction="column" component="section">
      <Grid item component={NavBar} />
      <Grid item component="main">
        {showHero && <LandingHero />}
        <Container>{children ?? ''}</Container>
      </Grid>
      {/* <Grid item component={Footer} /> */}
    </Grid>
  );
};

export default Layout;
