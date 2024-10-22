import {
  useDisclosure,
  Button,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  MenuItem,
} from '@chakra-ui/react';
import { MouseEvent, useRef } from 'react';

export const DeleteLibrary = ({
  format = 'button',
  onDelete,
  isDisabled = false,
}: {
  format?: 'button' | 'menuitem';
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
      {format === 'button' ? (
        <Button onClick={handleOpen} colorScheme="red" mt={4} isDisabled={isDisabled}>
          Delete Library
        </Button>
      ) : (
        <MenuItem onClick={handleOpen} isDisabled={isDisabled}>
          Delete Library
        </MenuItem>
      )}
      <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Library
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
