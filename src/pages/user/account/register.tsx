import { GetServerSideProps, NextPage } from 'next';

const Register: NextPage = () => {
  return (
    <div className="bg-grey-lighter flex flex-col min-h-screen">
      <div className="container flex flex-1 flex-col items-center justify-center mx-auto px-2 max-w-sm">
        <div className="px-6 py-8 w-full text-black bg-white rounded shadow-md">
          <h1 className="mb-8 text-center text-3xl">Sign up</h1>
          <input
            type="text"
            className="border-grey-light block mb-4 p-3 w-full border rounded"
            name="fullname"
            placeholder="Full Name"
          />
          <input
            type="text"
            className="border-grey-light block mb-4 p-3 w-full border rounded"
            name="email"
            placeholder="Email"
          />
          <input
            type="password"
            className="border-grey-light block mb-4 p-3 w-full border rounded"
            name="password"
            placeholder="Password"
          />
          <input
            type="password"
            className="border-grey-light block mb-4 p-3 w-full border rounded"
            name="confirm_password"
            placeholder="Confirm Password"
          />
          <button
            type="submit"
            className="bg-green hover:bg-green-dark my-1 py-3 w-full text-center text-white rounded focus:outline-none"
          >
            Create Account
          </button>
          <div className="text-grey-dark mt-4 text-center text-sm">
            By signing up, you agree to the
            <a className="border-grey-dark text-grey-dark no-underline border-b" href="#">
              Terms of Service
            </a>{' '}
            and
            <a className="border-grey-dark text-grey-dark no-underline border-b" href="#">
              Privacy Policy
            </a>
          </div>
        </div>
        <div className="text-grey-dark mt-6">
          Already have an account?
          <a className="border-blue text-blue no-underline border-b" href="../login/">
            Log in
          </a>
          .
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/not-implemented',
      permanent: false,
    },
  };
};

export default Register;
