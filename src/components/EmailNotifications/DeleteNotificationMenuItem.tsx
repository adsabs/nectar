import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  MenuItem,
  useDisclosure,
} from '@chakra-ui/react';
import { MouseEvent, useRef } from 'react';

export const DeleteNotificationMenuItem = ({
  onDelete,
  isDisabled = false,
}: {
  onDelete: () => void;
  isDisabled?: boolean;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onOpen();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <>
      <MenuItem onClick={handleOpen} isDisabled={isDisabled}>
        Delete Notification
      </MenuItem>
      <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Noficitaion
            </AlertDialogHeader>
            <AlertDialogBody>Are you sure? You can&#39;t undo this action.</AlertDialogBody>
            <AlertDialogFooter backgroundColor="transparent">
              <Button ref={cancelRef} onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3} data-testid="confirm-del-lib-btn">
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
