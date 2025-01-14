import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Checkbox,
  Button,
  FormErrorMessage,
  HStack,
  Text,
} from '@chakra-ui/react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';

interface FormValues {
  name: string;
  desc: string;
  isPublic: boolean;
}

const initialFormValues: FormValues = {
  name: '',
  desc: '',
  isPublic: false,
};

const validationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  desc: z.string(),
  isPublic: z.boolean(),
});

export const AddLibraryModal = ({
  isOpen,
  onClose,
  onAddLibrary,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddLibrary: (name: string, desc: string, isPublic: boolean) => void;
  isLoading: boolean;
}) => {
  const formMethods = useForm<FormValues>({
    defaultValues: initialFormValues,
    resolver: zodResolver(validationSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  const {
    register,
    getValues,
    formState: { errors },
    reset,
    handleSubmit,
  } = formMethods;

  const handleAddLibrary = () => {
    const { name, desc, isPublic } = getValues();
    onAddLibrary(name, desc, isPublic);
  };

  const handleOnClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add a New Library</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(handleAddLibrary)} data-testid="add-new-lib-modal">
              <Flex direction="column" gap={2}>
                <FormControl isRequired isInvalid={!!errors?.name}>
                  <FormLabel>Enter a name for the new library: </FormLabel>
                  <Input {...register('name', { required: true })} autoFocus data-testid="new-library-name" />
                  <FormErrorMessage>{errors?.name && errors.name.message}</FormErrorMessage>
                </FormControl>
                <FormControl>
                  <FormLabel>Description: </FormLabel>
                  <Textarea {...register('desc')} data-testid="new-library-desc" />
                  <FormErrorMessage>{errors?.desc && errors.desc.message}</FormErrorMessage>
                </FormControl>
                <Checkbox {...register('isPublic')}>Make library public</Checkbox>
                <Text fontSize="sm" fontStyle="italic">
                  Public libraries are available for all to read. Private libraries are visible to only you and any
                  collaborators.
                </Text>
              </Flex>
              <HStack mt={4} justifyContent="end">
                <Button type="submit" isLoading={isLoading}>
                  Submit
                </Button>
                <Button variant="outline" onClick={handleOnClose} data-testid="cancel-add-lib">
                  Cancel
                </Button>
              </HStack>
            </form>
          </FormProvider>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
