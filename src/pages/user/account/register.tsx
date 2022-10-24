import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Container,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  ListItem,
  Stack,
  UnorderedList,
  useBoolean,
} from '@chakra-ui/react';
import { SimpleLink } from '@components';
import { useSession } from '@hooks/useSession';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const GOOGLE_RECAPTCHA_KEY = '6Lex_aQUAAAAAMwJFbdGFeigshN7mRQdbXoGQ7-N';

const update = (cb: (value: string) => void) => (e: ChangeEvent<HTMLInputElement>) => cb(e.currentTarget.value);

const Register: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated } = useSession();

  // form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string>(null);
  const [showPassword, setShowPassword] = useBoolean(false);

  // registration handling
  const { register } = useSession();
  const [error, setError] = useState<string>(null);

  // refs
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef();

  const isFormInvalid = useCallback(() => {
    console.log({ password, confirmPassword, upper: /^[^A-Z]+$/.exec(password) });

    setFormError(null);
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      confirmPasswordRef.current.select();
      confirmPasswordRef.current.focus();
      return true;
    } else if (password.length < 4) {
      setFormError('Passwords must be at least 4 characters long');
      passwordRef.current.select();
      passwordRef.current.focus();
      return true;
    } else if (/^[^A-Z]+$/.exec(password) !== null) {
      setFormError('Passwords must contain at least 1 uppercase letter');
      passwordRef.current.select();
      passwordRef.current.focus();
      return true;
    } else if (/^[^a-z]+$/.exec(password) !== null) {
      setFormError('Passwords must contain at least 1 lowercase letter');
      passwordRef.current.select();
      passwordRef.current.focus();
      return true;
    } else if (/^[^0-9]+$/.exec(password) !== null) {
      setFormError('Passwords must contain at least 1 digit');
      passwordRef.current.select();
      passwordRef.current.focus();
      return true;
    }
  }, [password, confirmPassword, passwordRef, confirmPasswordRef]);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // check form for errors, this will alert user
      if (isFormInvalid()) {
        return;
      }

      // get recaptcha token
      const recaptcha = await (
        recaptchaRef.current as {
          executeAsync: () => Promise<string>;
        }
      ).executeAsync();

      // attempt to register user, displaying an error or redirecting
      const result = await register({ email, password, confirmPassword, recaptcha });
      setError(result?.error ?? null);
    },
    [register, email, password, isFormInvalid],
  );

  // if already authenticated, redirect immediately
  if (isAuthenticated) {
    void router.push('/', null, { shallow: false });
    return null;
  }

  return (
    <div>
      <Head>
        <title>NASA Science Explorer - Register</title>
      </Head>

      <Container display="flex" flexDirection="column" py="24">
        <Heading alignSelf="center">Welcome!</Heading>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <ReCAPTCHA ref={recaptchaRef} size="invisible" sitekey={GOOGLE_RECAPTCHA_KEY} />
          <Stack direction="column" spacing={4}>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input
                autoFocus
                type="email"
                required
                placeholder="email@example.com"
                name="email"
                id="email"
                onChange={update(setEmail)}
                value={email}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Password</FormLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                required
                name="password"
                id="password"
                onChange={update(setPassword)}
                value={password}
                ref={passwordRef}
              />
              <FormHelperText>
                <Heading size="xs" id="password-reqs">
                  Password requirements:
                </Heading>
                <UnorderedList aria-labelledby="password-reqs">
                  <ListItem>1 lowercase letter</ListItem>
                  <ListItem>1 uppercase letter</ListItem>
                  <ListItem>1 numerical digit</ListItem>
                  <ListItem>At least 4 characters long</ListItem>
                </UnorderedList>
              </FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                required
                name="confirmpassword"
                id="confirmpassword"
                onChange={update(setConfirmPassword)}
                value={confirmPassword}
                ref={confirmPasswordRef}
              />
              <Button type="button" variant="link" onClick={setShowPassword.toggle}>
                {showPassword ? 'Hide password' : 'Show password'}
              </Button>
            </FormControl>
            <Button type="submit">Register</Button>
            <SimpleLink alignSelf="center" href="/user/account/login">
              Login
            </SimpleLink>
            {error && (
              <Alert status="error">
                <AlertTitle>Unable to register user</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {formError && (
              <Alert status="error">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
          </Stack>
        </form>
      </Container>
    </div>
  );
};

export default Register;
