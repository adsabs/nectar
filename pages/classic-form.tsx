import { createStyles, makeStyles, Theme, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) => createStyles({}));

const Home: React.FC = () => {
  const classes = useStyles();

  return (
    <>
      <Typography>Classic Form</Typography>
    </>
  );
};

export default Home;
