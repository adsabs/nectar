import { Button, FormControl, FormErrorMessage, FormLabel, Stack } from '@chakra-ui/react';
import { PasswordRequirements, PasswordTextInput, SettingsLayout, StandardAlertMessage } from '@components';
import { Control, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useFocus } from '@lib/useFocus';
import { parseAPIError } from '@utils';
import { IUserChangePasswordCredentials, useChangeUserPassword } from '@api';

const initialParams: IUserChangePasswordCredentials = { currentPassword: '', password: '', confirmPassword: '' };
const passwordValidators = {
  uppercase: (password: string) => /[A-Z]/.test(password),
  lowercase: (password: string) => /[a-z]/.test(password),
  digit: (password: string) => /\d/.test(password),
};

const ChangePasswordPage = () => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: initialParams,
  });
  const { mutate: submit, isLoading, isError, error, data } = useChangeUserPassword();
  const { ref, ...registerProps } = register('currentPassword', { required: true });
  const [currentPasswordRef] = useFocus();

  const onFormSubmit: SubmitHandler<IUserChangePasswordCredentials> = (params, e) => {
    submit(params);
  };

  return (
    <SettingsLayout title="Change Password">
      <form onSubmit={handleSubmit(onFormSubmit)} aria-labelledby="settings-section-title">
        <Stack direction="column" spacing={4}>
          <FormControl isRequired isInvalid={!!errors.currentPassword}>
            <FormLabel>Current Password</FormLabel>
            <PasswordTextInput
              autoFocus
              name="currentPassword"
              id="currentPassword"
              ref={(value) => {
                currentPasswordRef.current = value;
                ref(value);
              }}
              {...registerProps}
            />
          </FormControl>
          <FormControl isRequired isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <PasswordTextInput
              name="password"
              id="password"
              {...register('password', {
                required: true,
                minLength: 4,
                validate: passwordValidators,
              })}
            />
            <RequirementsController control={control} />
          </FormControl>
          <FormControl isRequired isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm password</FormLabel>
            <PasswordTextInput
              name="confirmPassword"
              id="confirmPassword"
              {...register('confirmPassword', {
                required: true,
                validate: (value) => value === getValues('password'),
              })}
            />
            {!!errors.confirmPassword && <FormErrorMessage>Passwords do not match</FormErrorMessage>}
          </FormControl>
          <Button type="submit" isLoading={isLoading}>
            Submit
          </Button>
        </Stack>
      </form>
      {!!data && <StandardAlertMessage status="success" title="Password Changed" />}
      {isError && (
        <StandardAlertMessage
          status="error"
          title="Unable to register, please try again"
          description={parseAPIError(error)}
        />
      )}
    </SettingsLayout>
  );
};

export default ChangePasswordPage;

export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';

const RequirementsController = ({ control }: { control: Control<IUserChangePasswordCredentials> }) => {
  const password = useWatch({ control, name: 'password' });
  return <PasswordRequirements password={password} />;
};
