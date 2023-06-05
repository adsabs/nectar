import { IOrcidProfileEntry } from '@api/orcid/types/orcid-profile';
import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  ButtonProps,
  forwardRef,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useToast,
  UseToastOptions,
} from '@chakra-ui/react';
import { OrcidInactiveLogo, OrcidLogo } from '@components';
import { isClaimedBySciX, isInSciX } from './Utils';
import { MenuItemProps } from '@chakra-ui/menu';
import { useUpdateWork } from '@lib/orcid/useUpdateWork';
import { useAddWorks } from '@lib/orcid/useAddWorks';
import { useRemoveWorks } from '@lib/orcid/useRemoveWorks';
import { AppState, useStore } from '@store';
import { useCallback } from 'react';

export interface IActionProps {
  work: IOrcidProfileEntry;
}

const TOAST_DEFAULTS: UseToastOptions = {
  duration: 2000,
};

export const Actions = ({ work }: IActionProps) => {
  const claimedBySciX = isClaimedBySciX(work);
  const inSciX = isInSciX(work);

  return (
    <>
      {work.status ? (
        <Menu>
          <MenuButton
            as={Button}
            isDisabled={!inSciX}
            variant="outline"
            rightIcon={<ChevronDownIcon />}
            color="gray.500"
            w={28}
          >
            <HStack spacing={1}>
              <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
              <span>Actions</span>
            </HStack>
          </MenuButton>
          <MenuList>
            <SyncToOrcidMenuItem identifier={work.identifier} isDisabled />
            <AddClaimMenuItem identifier={work.identifier} isDisabled={claimedBySciX} />
            <DeleteClaimMenuItem identifier={work.identifier} isDisabled={!claimedBySciX} />
          </MenuList>
        </Menu>
      ) : (
        <AddToOrcidButton identifier={work.identifier} />
      )}
    </>
  );
};

interface IOrcidActionProps extends MenuItemProps {
  identifier: string;
}

interface IOrcidActionBtnProps extends ButtonProps {
  identifier: string;
}

export const AddToOrcidButton = forwardRef<IOrcidActionBtnProps, 'button'>((props, ref) => {
  const { identifier, ...buttonProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const { addWorks, isLoading } = useAddWorks(
    {},
    {
      onSuccess: () => {
        toast({ status: 'success', title: 'Successfully submitted claim request' });
      },
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to submit request', description: error.message });
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
        <OrcidInactiveLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
        <Text fontSize="xs">Claim</Text>
      </HStack>
    </Button>
  );
});

export const DeleteFromOrcidButton = forwardRef<IOrcidActionBtnProps, 'button'>((props, ref) => {
  const { identifier, ...buttonProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const { removeWorks, isLoading } = useRemoveWorks(
    {},
    {
      onSuccess: () => {
        toast({ status: 'success', title: 'Successfully submitted remove claim request' });
      },
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to submit request', description: error.message });
      },
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
        <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
        <Text fontSize="xs">Delete Claim</Text>
      </HStack>
    </Button>
  );
});

const SyncToOrcidMenuItem = (props: IOrcidActionProps) => {
  const { identifier, ...menuItemProps } = props;
  const { updateWork } = useUpdateWork();

  return (
    <MenuItem onClick={() => updateWork(identifier)} {...menuItemProps}>
      Sync to ORCiD
    </MenuItem>
  );
};

const AddClaimMenuItem = (props: IOrcidActionProps) => {
  const { identifier, ...menuItemProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const { addWorks } = useAddWorks(
    {},
    {
      onSuccess: () => {
        toast({ status: 'success', title: 'Successfully submitted claim request' });
      },
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to submit request', description: error.message });
      },
    },
  );

  return (
    <MenuItem onClick={() => addWorks([identifier])} {...menuItemProps}>
      Claim from SciX
    </MenuItem>
  );
};
const DeleteClaimMenuItem = (props: IOrcidActionProps) => {
  const { identifier, ...menuItemProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const { removeWorks } = useRemoveWorks(
    {},
    {
      onSuccess: () => {
        toast({ status: 'success', title: 'Successfully submitted remove claim request' });
      },
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to submit request', description: error.message });
      },
    },
  );

  return (
    <MenuItem onClick={() => removeWorks([identifier])} {...menuItemProps}>
      Delete claim from SciX
    </MenuItem>
  );
};

const selectedDocsSelector = (state: AppState) => state.docs.selected;
export const BulkClaimMenuItem = (props: MenuItemProps) => {
  const toast = useToast(TOAST_DEFAULTS);
  const { addWorks } = useAddWorks(
    {},
    {
      onSuccess: () => {
        toast({ status: 'success', title: 'Successfully submitted claim request' });
      },
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to submit request', description: error.message });
      },
    },
  );
  const selected = useStore(selectedDocsSelector);
  const handleClick = useCallback(() => {
    addWorks(selected);
  }, [addWorks, selected]);

  return (
    <MenuItem onClick={handleClick} isDisabled={selected.length === 0} {...props}>
      Claim from SciX
    </MenuItem>
  );
};

export const BulkDeleteMenuItem = (props: MenuItemProps) => {
  const toast = useToast(TOAST_DEFAULTS);
  const { removeWorks } = useRemoveWorks(
    {},
    {
      onSuccess: () => {
        toast({ status: 'success', title: 'Successfully submitted remove claim request' });
      },
      onError: (error) => {
        toast({ status: 'error', title: 'Unable to submit request', description: error.message });
      },
    },
  );

  const selected = useStore(selectedDocsSelector);
  const handleClick = useCallback(() => {
    removeWorks(selected);
  }, [removeWorks, selected]);

  return (
    <MenuItem onClick={handleClick} isDisabled={selected.length === 0} {...props}>
      Delete claim from SciX
    </MenuItem>
  );
};
