import Link from '@components/Link';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  createStyles,
  Grid,
  makeStyles,
  Paper,
  Theme,
  Typography,
  useMediaQuery,
} from '@material-ui/core';
import { useRouter } from 'next/router';
import React from 'react';
import LandingTabs from './LandingTabs';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      position: 'relative',
      overflow: 'hidden',
      height: '170px',
      '& > img': {
        width: '100%',
        filter: 'brightness(75%)',
      },
    },
    heroText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -70%)',
      color: theme.palette.primary.contrastText,
      '& img': {
        width: '80px',
        marginRight: theme.spacing(1),
      },
    },
    tabs: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translate(-50%)',
    },
    tabRoot: {
      color: theme.palette.primary.contrastText,
    },
    tabSelected: {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.text.primary,
    },
  })
);

const LandingHero: React.FC = () => {
  const classes = useStyles();
  const { asPath, push } = useRouter();
  const smallScreen = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );
  const handleNavigationChange = (event: React.ChangeEvent<{}>, value: any) => {
    push(value);
  };

  if (smallScreen) {
    return (
      <BottomNavigation
        showLabels
        value={asPath}
        onChange={handleNavigationChange}
        style={{
          width: '100%',
          position: 'fixed',
          bottom: 0,
        }}
      >
        <BottomNavigationAction value="/classic-form" label="Classic Form" />
        <BottomNavigationAction value="/" label="Modern Form" />
        <BottomNavigationAction value="/paper-form" label="Paper Form" />
      </BottomNavigation>
    );
  }

  return (
    <section className={classes.root}>
      <img src="/img/starry_background.jpg" alt="starry background" />
      <section className={classes.heroText}>
        <Typography component="div" variant="h3" noWrap>
          <Grid container wrap="nowrap">
            <img src="/img/transparent_logo.svg" />
            <Grid container direction="column" justify="center">
              <Grid item>
                <Box fontWeight="bold" component="span">
                  astrophysics
                </Box>{' '}
                data system
              </Grid>
            </Grid>
          </Grid>
        </Typography>
      </section>

      <div className={classes.tabs}>
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <LandingTabs />
        </Box>
      </div>
    </section>
  );
};

const T = ({
  href,
  label,
  selected,
}: {
  label: string;
  href: string;
  selected?: boolean;
}) => {
  return (
    <Link href={href}>
      <Paper
        classes={{}}
        style={{
          borderRadius: '25px 25px 0 0',
          textAlign: 'center',
          padding: '20px 20px',
          backgroundColor: selected ? 'white' : 'transparent',
        }}
      >
        {label}
      </Paper>
    </Link>
  );
};

export default LandingHero;
