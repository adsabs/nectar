import {
  AppBar,
  Button,
  createStyles,
  Grid,
  IconButton,
  makeStyles,
  NoSsr,
  Theme,
  Toolbar,
  Typography,
} from '@material-ui/core';
import { Brightness3, BrightnessHigh, Menu } from '@material-ui/icons';
import Link from 'next/link';
import React from 'react';
import useDarkMode from 'use-dark-mode';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  })
);

const NavBar: React.FC = () => {
  const classes = useStyles();

  return (
    <header className={classes.root}>
      <AppBar component="section" position="static">
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
          >
            <Menu />
          </IconButton>
          <Grid item className={classes.title}>
            <Link href="/search/query" passHref>
              <Button component="a" color="inherit">
                <Typography variant="h6" component="h1">
                  ADS
                </Typography>
              </Button>
            </Link>
          </Grid>
          <NoSsr>
            <ThemeToggle />
          </NoSsr>
          <Link href="/login" passHref>
            <Button component="a" color="inherit">
              Login
            </Button>
          </Link>
        </Toolbar>
      </AppBar>
    </header>
  );
};

const ThemeToggle = () => {
  const { value: isDark, toggle } = useDarkMode();

  return (
    <IconButton color="inherit" aria-label="theme toggle" onClick={toggle}>
      {isDark ? <BrightnessHigh /> : <Brightness3 />}
    </IconButton>
  );
};

export default NavBar;
