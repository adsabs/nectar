import { Button, chakra, FormControl, FormLabel, Input, Stack, Text } from '@chakra-ui/react';

import { PasswordTextInput } from '@/components/TextInput/PasswordTextInput';
import { useStore } from '@/store';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useFocus } from '@/lib/useFocus';
import { StandardAlertMessage } from '@/components/Feedbacks';
import { SettingsLayout } from '@/components/Layout';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IUserChangeEmailCredentials } from '@/api/user/types';
import { useChangeUserEmail } from '@/api/user/user';

const UpdateEmailPage = () => {
  const email = useStore((state) => state.user?.username);
  const { register, handleSubmit } = useForm<IUserChangeEmailCredentials>({
    defaultValues: { email: '', password: '' },
  });
  const { ref: emailRef, ...emailRegisterProps } = register('email', { required: true });
  const { mutate: submit, error, isError, isLoading, data } = useChangeUserEmail();
  const [mainInputRef] = useFocus();

  const onFormSubmit: SubmitHandler<IUserChangeEmailCredentials> = (params) => {
    submit(params);
  };

  return (
    <SettingsLayout title="Update Email">
      <form onSubmit={handleSubmit(onFormSubmit)} aria-labelledby="settings-section-title">
        <Stack direction="column" spacing={4} my={2}>
          <Text>
            Your current email is: <chakra.span fontWeight="bold">{email}</chakra.span>
          </Text>
          <FormControl isRequired>
            <FormLabel>New Email</FormLabel>
            <Input
              type="text"
              placeholder="email@example.com"
              autoFocus
              name="email"
              id="email"
              autoComplete="email"
              ref={(value) => {
                emailRef(value);
                mainInputRef.current = value;
              }}
              {...emailRegisterProps}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <PasswordTextInput
              name="password"
              id="password"
              autoComplete="password"
              {...register('password', { required: true })}
            />
          </FormControl>

          <Button type="submit" isLoading={isLoading}>
            Submit
          </Button>
          {isError && (
            <StandardAlertMessage status="error" title="Unable to update email" description={parseAPIError(error)} />
          )}
          {!!data && (
            <StandardAlertMessage
              status="success"
              title="Email Updated"
              description="Please check your email for a verification link."
            />
          )}
        </Stack>
      </form>
    </SettingsLayout>
  );
};

export default UpdateEmailPage;

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';
