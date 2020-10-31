import { createStyles, makeStyles, Theme, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) => createStyles({}));

const Home: React.FC = () => {
  const classes = useStyles();

  return (
    <>
      <Typography>Paper form</Typography>
    </>
  );
};

export default Home;
