import {
  AppBar,
  createStyles,
  makeStyles,
  Theme,
  withStyles,
} from '@material-ui/core';
import React from 'react';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexGrow: 1,
      '& *': {
        color: theme.palette.secondary.contrastText,
      },
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
    logo: {
      width: 48,
      marginRight: 10,
    },
    logoText: {
      fontWeight: 'bold',
      textTransform: 'lowercase',
    },
  })
);

const DarkAppBar = withStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.grey[900],
  },
}))(AppBar);

const NavBar: React.FC = () => {
  return (
    <nav className="bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12">
          <img
            className="h-10 w-10"
            src="/img/transparent_logo.svg"
            alt="Workflow logo"
          />
          <div className="text-white text-2xl font-medium ml-2">ads</div>
        </div>
      </div>
    </nav>
  );

  // const classes = useStyles();
  // return (
  //   <header className={classes.root}>
  //     <DarkAppBar component="section" position="static">
  //       <Toolbar variant="dense">
  //         <Grid item className={classes.title}>
  //           <Button component={Link} href="/">
  //             <img
  //               className={classes.logo}
  //               src="/img/transparent_logo.svg"
  //               alt="ads logo"
  //             />
  //             <Typography
  //               variant="h5"
  //               component="h1"
  //               className={classes.logoText}
  //             >
  //               ads
  //               <Typography variant="srOnly">go home</Typography>
  //             </Typography>
  //           </Button>
  //         </Grid>
  //         {/* <ThemeToggle /> */}
  //         <Button component={Link} href="/login">
  //           Login
  //         </Button>
  //       </Toolbar>
  //     </DarkAppBar>
  //   </header>
  // );
};

export default NavBar;
