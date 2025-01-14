import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LibrarySelector } from './LibrarySelector';
import { IADSApiLibraryOperationParams, LibraryIdentifier, LibraryOperationAction } from '@/api/biblib/types';

type LibraryIdentifierValue = {
  value: LibraryIdentifier;
};

interface FormValues {
  action: LibraryOperationAction;
  libs: LibraryIdentifierValue[];
  source: LibraryIdentifier;
  target: LibraryIdentifier;
  name: string;
  desc: string;
  isPublic: boolean;
}

const initialFormValues: FormValues = {
  action: 'union',
  libs: [],
  source: null,
  target: null,
  name: '',
  desc: '',
  isPublic: false,
};

const validationSchema = z
  .object({
    action: z.custom<LibraryOperationAction>(),
    libs: z.custom<LibraryIdentifierValue>().array(),
    source: z.custom<LibraryIdentifier>(),
    target: z.custom<LibraryIdentifier>(),
    desc: z.string(),
    isPublic: z.boolean(),
    name: z.string(),
  })
  .superRefine((schema, context) => {
    if (
      (schema.action === 'union' || schema.action === 'intersection' || schema.action === 'difference') &&
      schema.libs.length < 2
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['libs'],
        message: 'Must select at least two libraries',
      });
    }
    if (
      (schema.action === 'union' || schema.action === 'intersection' || schema.action === 'difference') &&
      schema.name.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['name'],
        message: 'Name is required',
      });
    }
    if ((schema.action === 'copy' || schema.action === 'empty') && (!schema.source || schema.source.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['source'],
        message: 'Source library is required',
      });
    }
    if (schema.action === 'copy' && (!schema.target || schema.target.length === 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target'],
        message: 'Target library is required',
      });
    }
    return z.NEVER;
  });

export const OperationModal = ({
  isOpen,
  onClose,
  onOperate,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOperate: (params: IADSApiLibraryOperationParams) => void;
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
    control,
    setValue,
    formState: { errors },
    reset,
    handleSubmit,
  } = formMethods;

  const {
    fields: libs,
    append,
    remove,
  } = useFieldArray<FormValues, 'libs'>({
    name: 'libs',
    control,
  });

  const action = useWatch<FormValues, 'action'>({ name: 'action', control });

  const handleAddLib = (id: LibraryIdentifier) => {
    append({ value: id });
  };
  const handleRemoveLib = (id: LibraryIdentifier) => {
    remove(libs.findIndex((l) => l.value === id));
  };

  const handleOperate = (data: FormValues) => {
    const { action, libs, source, target, name, desc, isPublic } = data;

    switch (action) {
      case 'union':
      case 'intersection':
      case 'difference':
        onOperate({
          action: action,
          id: libs[0].value,
          libraries: libs.slice(1).map((l) => l.value),
          name: name,
          description: desc,
          public: isPublic,
        });
        return;
      case 'copy':
        onOperate({
          action: action,
          id: source,
          libraries: [target],
          name: name,
          description: desc,
          public: false,
        });
        return;
      case 'empty':
        onOperate({ action: action, id: source });
        return;
      default:
        return;
    }
  };

  const handleOnClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleOnClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Library Operations</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(handleOperate)} data-testid="lib-operation-modal">
              <Flex direction="column" gap={4}>
                <FormControl>
                  <FormLabel>Action:</FormLabel>
                  <Controller
                    name="action"
                    control={control}
                    render={({ field: { ref, ...rest } }) => (
                      <RadioGroup {...rest}>
                        <Stack direction={{ base: 'column', sm: 'row' }}>
                          <Radio value="union" autoFocus>
                            Union
                          </Radio>
                          <Radio value="intersection" data-testid="radio-intersect">
                            Intersection
                          </Radio>
                          <Radio value="difference" data-testid="radio-diff">
                            Difference
                          </Radio>
                          <Radio value="copy" data-testid="radio-copy">
                            Copy
                          </Radio>
                          <Radio value="empty" data-testid="radio-empty">
                            Empty
                          </Radio>
                        </Stack>
                      </RadioGroup>
                    )}
                  />
                </FormControl>
                {(action === 'union' || action === 'intersection' || action === 'difference') && (
                  <>
                    <FormControl isInvalid={!!errors?.libs}>
                      <FormLabel>Select Libraries:</FormLabel>
                      <LibrarySelector isMultiple onSelect={handleAddLib} onDeselect={handleRemoveLib} />
                      <FormErrorMessage>{errors?.libs && errors.libs.message}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors?.name}>
                      <FormLabel>New Library Name:</FormLabel>
                      <Input {...register('name', { required: true })} data-testid="new-lib-name" />
                      <FormErrorMessage>{errors?.name && errors.name.message}</FormErrorMessage>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Description:</FormLabel>
                      <Textarea {...register('desc')} data-testid="new-lib-desc" />
                    </FormControl>
                    <Checkbox {...register('isPublic')}>Make library public</Checkbox>
                  </>
                )}
                {(action === 'copy' || action === 'empty') && (
                  <FormControl isInvalid={!!errors?.source} data-testid="source-selector">
                    <FormLabel>Source Library:</FormLabel>
                    <LibrarySelector
                      isMultiple={false}
                      onSelect={(id) => setValue('source', id)}
                      onDeselect={() => setValue('source', null)}
                    />
                    <FormErrorMessage>{errors?.source && errors.source.message}</FormErrorMessage>
                  </FormControl>
                )}
                {action === 'copy' && (
                  <FormControl isInvalid={!!errors?.target} data-testid="target-selector">
                    <FormLabel>Target Library:</FormLabel>
                    <LibrarySelector
                      isMultiple={false}
                      onSelect={(id) => setValue('target', id)}
                      onDeselect={() => setValue('target', null)}
                    />
                    <FormErrorMessage>{errors?.target && errors.target.message}</FormErrorMessage>
                  </FormControl>
                )}
              </Flex>
              <HStack mt={4} justifyContent="end">
                <Button type="submit" isLoading={isLoading}>
                  Submit
                </Button>
                <Button variant="outline" onClick={handleOnClose} data-testid="cancel-lib-operation">
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
