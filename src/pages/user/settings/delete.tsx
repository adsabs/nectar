import { Button, chakra, FormControl, FormErrorMessage, FormLabel, Input, Stack, Text } from '@chakra-ui/react';
import { SettingsLayout, StandardAlertMessage } from '@components';
import { FormEventHandler, useState } from 'react';
import { AppState, useStore } from '@store';
import { parseAPIError } from '@utils';
import { useSession } from '@lib/useSession';
import { useDeleteAccount } from '@api';

type FormError = {
  param: string;
  msg: string;
};

const DeleteAccountPage = () => {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<FormError>(null);
  const storeEmail = useStore((state: AppState) => state.user.username);
  const { logout } = useSession({ redirectWithMessage: 'account-deleted-success' });
  const {
    mutate: deleteAccount,
    error,
    isError,
    isLoading,
  } = useDeleteAccount({
    onSuccess: () => logout(),
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    // check if form is invalid
    if (email !== storeEmail) {
      return setFormError({
        param: 'email',
        msg: 'Email does not match',
      });
    }

    // trigger mutation
    deleteAccount(null);
  };

  return (
    <SettingsLayout title="Delete Account">
      <form onSubmit={handleSubmit} aria-labelledby="settings-section-title">
        <Stack direction="column" spacing={4} my={2}>
          <Text>
            Your current email is: <chakra.span fontWeight="bold">{storeEmail}</chakra.span>
          </Text>
          <FormControl isRequired isInvalid={formError?.param === 'email'} isDisabled={isLoading}>
            <FormLabel>Confirm your email</FormLabel>
            <Input
              type="email"
              autoFocus
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            {formError?.param === 'email' ? <FormErrorMessage>{formError.msg}</FormErrorMessage> : null}
          </FormControl>
          <Button variant="warning" size="md" type="submit" isLoading={isLoading}>
            Delete My Account
          </Button>
          <StandardAlertMessage status="warning" title="This action cannot be reversed" />
          {isError ? (
            <StandardAlertMessage
              status="error"
              title="Unable to complete request"
              description={parseAPIError(error)}
            />
          ) : null}
        </Stack>
      </form>
    </SettingsLayout>
  );
};

export default DeleteAccountPage;

export { injectSessionGSSP as getServerSideProps } from '@ssr-utils';
