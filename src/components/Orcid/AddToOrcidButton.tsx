import { Button, ButtonProps, forwardRef, HStack, Icon, Text, useToast } from '@chakra-ui/react';
import { TOAST_DEFAULTS } from '@/components/Orcid/helpers';
import { useAddWorks } from '@/lib/orcid/useAddWorks';
import { parseAPIError } from '@/utils';
import { OrcidInactiveLogo } from '@/components';
import React from 'react';

interface IOrcidActionBtnProps extends ButtonProps {
  identifier: string;
}
export const AddToOrcidButton = forwardRef<IOrcidActionBtnProps, 'button'>((props, ref) => {
  const { identifier, ...buttonProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const { addWorks, isLoading } = useAddWorks(
    {},
    {
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to claim work', description: parseAPIError(error) });
      },
      onSettled: (data) => {
        // should only be a single entry
        const result = Object.values(data)[0];

        if (result?.status === 'rejected') {
          toast({ status: 'error', title: 'Unable to claim work', description: parseAPIError(result?.reason) });
        }
      },
    },
  );

  return (
    <Button
      variant="outline"
      color="gray.500"
      isLoading={isLoading}
      onClick={() => addWorks([identifier])}
      w={28}
      ref={ref}
      {...buttonProps}
    >
      <HStack spacing={1}>
        <Icon as={OrcidInactiveLogo} boxSize={4} aria-hidden />
        <Text fontSize="xs">Claim</Text>
      </HStack>
    </Button>
  );
});
