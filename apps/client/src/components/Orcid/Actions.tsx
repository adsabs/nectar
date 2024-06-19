import { IOrcidProfileEntry } from '@/api/orcid/types/orcid-profile';
import {
  Center,
  Flex,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemProps,
  MenuList,
  Spinner,
  ToastId,
  useToast,
} from '@chakra-ui/react';
import { isClaimedBySciX, isInSciX } from './helpers';
import { useUpdateWork } from '@/lib/orcid/useUpdateWork';
import { useAddWorks } from '@/lib/orcid/useAddWorks';
import { useRemoveWorks } from '@/lib/orcid/useRemoveWorks';
import React, { useEffect, useRef } from 'react';
import { isOrcidProfileEntry } from '@/api/orcid/models';
import { TOAST_DEFAULTS } from '@/components/Orcid/helpers';
import { AddToOrcidButton } from '@/components/Orcid/AddToOrcidButton';
import { parseAPIError } from '@/utils';
import { Cog8ToothIcon } from '@heroicons/react/20/solid';

export interface IActionProps {
  work: IOrcidProfileEntry;
}

export const Actions = ({ work }: IActionProps) => {
  const claimedBySciX = isClaimedBySciX(work);
  const inSciX = isInSciX(work);

  if (!isOrcidProfileEntry(work)) {
    return null;
  }

  return (
    <>
      {work.status ? (
        <Center>
          <Menu>
            <MenuButton
              as={IconButton}
              isDisabled={!inSciX}
              variant="ghost"
              icon={<Icon as={Cog8ToothIcon} color="gray.500" fontSize="18px" aria-hidden />}
            />
            <MenuList>
              <SyncToOrcidMenuItem work={work} isDisabled={!claimedBySciX} />
              <AddClaimMenuItem identifier={work.identifier} isDisabled={claimedBySciX} />
              <DeleteClaimMenuItem identifier={work.identifier} isDisabled={!claimedBySciX} />
            </MenuList>
          </Menu>
        </Center>
      ) : (
        <AddToOrcidButton identifier={work.identifier} />
      )}
    </>
  );
};

interface IOrcidActionProps extends MenuItemProps {
  work?: IOrcidProfileEntry;
  identifier?: string;
}

const SyncToOrcidMenuItem = (props: IOrcidActionProps) => {
  const { work, ...menuItemProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const toastId = useRef<ToastId>();
  const { updateWork, error } = useUpdateWork(
    {},
    {
      onSuccess: () => {
        toast.update(toastId.current, { status: 'success', title: 'Claimed synced' });
      },
    },
  );

  useEffect(() => {
    if (error) {
      toast.update(toastId.current, {
        status: 'error',
        title: 'Unable to sync claim',
        description: parseAPIError(error),
      });
    }
  }, [error]);

  const handleSyncToOrcid = () => {
    toastId.current = toast({
      status: 'info',
      title: <SimpleLoadingTitle title="Syncing claim" />,
      isClosable: true,
      duration: 30 * 1000, // 30 seconds
    });
    if (work) {
      try {
        updateWork(work);
      } catch (error) {
        toast.update(toastId.current, { status: 'error', title: 'Unable to sync claim' });
      }
    }
  };

  return (
    <MenuItem onClick={handleSyncToOrcid} {...menuItemProps}>
      Sync to ORCiD
    </MenuItem>
  );
};

const AddClaimMenuItem = (props: IOrcidActionProps) => {
  const { identifier, ...menuItemProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const toastId = useRef<ToastId>();
  const { addWorks } = useAddWorks(
    {},
    {
      onError: (error) => {
        toast.update(toastId.current, {
          status: 'error',
          title: 'Unable to claim work',
          description: parseAPIError(error),
        });
      },
      onSettled: (data) => {
        // should only be a single entry
        const result = Object.values(data)[0];

        if (result?.status === 'rejected') {
          toast.update(toastId.current, {
            status: 'error',
            title: 'Unable to claim work',
            description: parseAPIError(result?.reason),
          });
        } else {
          toast.update(toastId.current, { status: 'success', title: 'Claim added' });
        }
      },
    },
  );

  const handleAddClaim = () => {
    toastId.current = toast({
      status: 'info',
      title: <SimpleLoadingTitle title="Adding claim" />,
      isClosable: true,
      duration: 30 * 1000, // 30 seconds
    });

    addWorks([identifier]);
  };

  return (
    <MenuItem onClick={handleAddClaim} {...menuItemProps}>
      Claim from SciX
    </MenuItem>
  );
};
const DeleteClaimMenuItem = (props: IOrcidActionProps) => {
  const { identifier, ...menuItemProps } = props;
  const toast = useToast(TOAST_DEFAULTS);
  const toastId = useRef<ToastId>();
  const { removeWorks } = useRemoveWorks({
    onError: (error) => {
      toast.update(toastId.current, {
        status: 'error',
        title: 'Unable to delete claim',
        description: parseAPIError(error),
      });
    },
    onSettled: (data) => {
      // should only be a single entry
      const result = Object.values(data)[0];

      if (result?.status === 'rejected') {
        toast.update(toastId.current, {
          status: 'error',
          title: 'Unable to delete claim',
          description: parseAPIError(result?.reason),
        });
      } else {
        toast.update(toastId.current, { status: 'success', title: 'Claim deleted' });
      }
    },
  });

  const handleDeleteClaim = () => {
    toastId.current = toast({
      status: 'info',
      title: <SimpleLoadingTitle title="Deleting claim" />,
      isClosable: true,
      duration: 30 * 1000, // 30 seconds
    });
    removeWorks([identifier]);
  };

  return (
    <MenuItem onClick={handleDeleteClaim} {...menuItemProps}>
      Delete claim from SciX
    </MenuItem>
  );
};

const SimpleLoadingTitle = (props: { title: string }) => {
  return (
    <Flex justifyContent="space-between">
      <>{props.title}</>
      <Spinner />
    </Flex>
  );
};
