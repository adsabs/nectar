import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  createStyles,
  makeStyles,
  Theme,
} from '@material-ui/core';

import { Menu } from '@material-ui/icons';

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
          <Typography variant="h6" className={classes.title}>
            Nectar
          </Typography>
          <Button color="inherit">Login</Button>
        </Toolbar>
      </AppBar>
    </header>
  );
};

export default NavBar;
