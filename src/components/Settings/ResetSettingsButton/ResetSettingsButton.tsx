import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { useSettings } from '@/lib/useSettings';
import { IADSApiUserDataParams, UserDataKeys } from '@/api/user/types';
import { DEFAULT_USER_DATA } from '@/api/user/models';

export interface ResetSettingsButtonProps {
  settingsKeys: UserDataKeys[];
  label: string;
}

export const ResetSettingsButton = ({ settingsKeys, label }: ResetSettingsButtonProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { updateSettings, updateSettingsState } = useSettings();

  const handleReset = () => {
    const resetParams: IADSApiUserDataParams = {};
    for (const key of settingsKeys) {
      resetParams[key] = DEFAULT_USER_DATA[key];
    }
    updateSettings(resetParams);
    onClose();
  };

  return (
    <>
      <Button
        variant="link"
        color="gray.500"
        fontSize="sm"
        fontWeight="normal"
        onClick={onOpen}
        isLoading={updateSettingsState.isPending}
        _hover={{ color: 'gray.700', textDecoration: 'underline' }}
      >
        {label}
      </Button>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Reset Settings
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This will restore these settings to their default values. This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleReset} ml={3}>
                Reset
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
