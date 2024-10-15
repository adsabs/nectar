import { Button, Divider, FormControl, FormErrorMessage, FormLabel, Spacer, Stack } from '@chakra-ui/react';

import { Control, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { useFocus } from '@/lib/useFocus';
import { IUserChangePasswordCredentials, useChangeUserPassword } from '@/api';
import { PasswordRequirements, PasswordTextInput } from '@/components/TextInput';
import { SettingsLayout } from '@/components/Layout';
import { StandardAlertMessage } from '@/components/Feedbacks';
import { parseAPIError } from '@/utils/common/parseAPIError';

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

  const onFormSubmit: SubmitHandler<IUserChangePasswordCredentials> = (params) => {
    submit(params);
  };

  return (
    <SettingsLayout title="Change Password">
      <form onSubmit={handleSubmit(onFormSubmit)} aria-labelledby="settings-section-title">
        <Stack direction="column" spacing={4} py="4">
          <FormControl isRequired isInvalid={!!errors.currentPassword}>
            <FormLabel>Current Password</FormLabel>
            <PasswordTextInput
              autoFocus
              name="currentPassword"
              id="currentPassword"
              autoComplete="password"
              ref={(value) => {
                currentPasswordRef.current = value;
                ref(value);
              }}
              {...registerProps}
            />
          </FormControl>
          <Spacer />
          <Divider />
          <Spacer />
          <FormControl isRequired isInvalid={!!errors.password}>
            <FormLabel>New Password</FormLabel>
            <PasswordTextInput
              name="password"
              id="password"
              autoComplete="new-password"
              {...register('password', {
                required: true,
                minLength: 4,
                validate: passwordValidators,
              })}
            />
            <RequirementsController control={control} />
          </FormControl>
          <FormControl isRequired isInvalid={!!errors.confirmPassword}>
            <FormLabel>Confirm New Password</FormLabel>
            <PasswordTextInput
              name="confirmPassword"
              id="confirmPassword"
              autoComplete="confirm-password"
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

export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';

const RequirementsController = ({ control }: { control: Control<IUserChangePasswordCredentials> }) => {
  const password = useWatch({ control, name: 'password' });
  return <PasswordRequirements password={password} />;
};
