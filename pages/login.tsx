import User from '@api/user';
import { NextPage, NextPageContext } from 'next';

const LoginResult: React.FC<ILoginResultProps> = ({ result }) => {
  return <pre>{JSON.stringify(result, null, 2)}</pre>;
};
interface ILoginResultProps {
  result: ILoginProps['result'];
}

const Login: NextPage<ILoginProps> = ({ csrf, result }) => {
  if (result) {
    return <LoginResult result={result} />;
  }

  return (
    <div>login page</div>
    // <Grid container justify="center" className={classes.root}>
    //   <Grid item xs={12} md={3}>
    //     <Paper className={classes.form} component="form" {...formProps}>
    //       <Grid container direction="column" className={classes.controls}>
    //         <Grid container>
    //           <Typography variant="h6">Login</Typography>
    //         </Grid>
    //         <TextField
    //           type="text"
    //           name="username"
    //           label="Email"
    //           required
    //           fullWidth
    //           variant="outlined"
    //         />
    //         <TextField
    //           type="password"
    //           name="password"
    //           label="Password"
    //           required
    //           fullWidth
    //           variant="outlined"
    //         />
    //         <input type="hidden" value={csrf} name="csrf" />
    //         <Grid container justify="flex-end">
    //           <Button type="submit" variant="contained" color="primary">
    //             Submit
    //           </Button>
    //         </Grid>
    //       </Grid>
    //     </Paper>
    //   </Grid>
    // </Grid>
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

export default Login;
