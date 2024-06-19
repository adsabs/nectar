import { Button, ButtonProps, forwardRef, HStack, Icon, Text, useToast } from '@chakra-ui/react';
import { TOAST_DEFAULTS } from '@/components/Orcid/helpers';
import { useRemoveWorks } from '@/lib/orcid/useRemoveWorks';
import { parseAPIError } from '@/utils';
import { OrcidLogo } from '@/components';
import React from 'react';

interface IOrcidActionBtnProps extends ButtonProps {
  identifier: string;
}

export const DeleteFromOrcidButton = forwardRef<IOrcidActionBtnProps, 'button'>((props, ref) => {
  const { identifier, ...buttonProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const { removeWorks, isLoading } = useRemoveWorks(
    {
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to delete claim', description: parseAPIError(error) });
      },
      onSettled: (data) => {
        // should only be a single entry
        const result = Object.values(data)[0];

        if (result?.status === 'rejected') {
          toast({ status: 'error', title: 'Unable to delete claim', description: parseAPIError(result?.reason) });
        }
      },
    },
    {
      getProfileOptions: { suspense: true },
    },
  );

  return (
    <Button
      variant="outline"
      color="gray.500"
      onClick={() => removeWorks([identifier])}
      isLoading={isLoading}
      ref={ref}
      w={28}
      {...buttonProps}
    >
      <HStack spacing={1}>
        <Icon as={OrcidLogo} boxSize="4" aria-hidden />
        <Text fontSize="xs">Delete Claim</Text>
      </HStack>
    </Button>
  );
});
