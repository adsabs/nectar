import User from '@api/user';
import {
  Button,
  createStyles,
  Grid,
  makeStyles,
  Paper,
  TextField,
  Theme,
  Typography,
} from '@material-ui/core';
import { NextPage, NextPageContext } from 'next';

const LoginResult: React.FC<ILoginResultProps> = ({ result }) => {
  return <pre>{JSON.stringify(result, null, 2)}</pre>;
};
interface ILoginResultProps {
  result: ILoginProps['result'];
}

const Login: NextPage<ILoginProps> = ({ csrf, result }) => {
  const classes = useStyles();

  if (result) {
    return <LoginResult result={result} />;
  }

  const formProps = {
    action: '/login',
    method: 'post',
  };

  return (
    <Grid container justify="center" className={classes.root}>
      <Grid item xs={12} md={3}>
        <Paper className={classes.form} component="form" {...formProps}>
          <Grid container direction="column" className={classes.controls}>
            <Grid container>
              <Typography variant="h6">Login</Typography>
            </Grid>
            <TextField
              type="text"
              name="username"
              label="Email"
              required
              fullWidth
              variant="outlined"
            />
            <TextField
              type="password"
              name="password"
              label="Password"
              required
              fullWidth
              variant="outlined"
            />
            <input type="hidden" value={csrf} name="csrf" />
            <Grid container justify="flex-end">
              <Button type="submit" variant="contained" color="primary">
                Submit
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

Login.getInitialProps = async (ctx: NextPageContext) => {
  const userApi = new User(ctx);

  if (ctx.req?.method === 'POST') {
    return { result: await userApi.login() };
  }

  const csrf = await userApi.fetchCSRF();

  return {
    csrf,
  };
};

export interface ILoginProps {
  csrf?: string;
  result?: any;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginTop: theme.spacing(5),
    },
    form: {
      padding: theme.spacing(2),
    },
    controls: {
      '& > *:not(:last-child)': { marginBottom: theme.spacing(2) },
    },
  })
);

export default Login;
