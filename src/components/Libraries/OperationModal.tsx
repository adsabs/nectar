/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  IADSApiLibraryOperationParams,
  ILibraryMetadata,
  LibraryIdentifier,
  LibraryOperationAction,
  useGetLibraries,
} from '@api';
import { CloseIcon } from '@chakra-ui/icons';
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
  Button,
  Radio,
  RadioGroup,
  Stack,
  InputGroup,
  InputRightElement,
  IconButton,
  useDisclosure,
  Textarea,
  Checkbox,
  FormErrorMessage,
  HStack,
} from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { ILibraryListTableSort, LibraryListTable } from './LibraryListTable';
import { TableSkeleton } from './TableSkeleton';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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
}: {
  isOpen: boolean;
  onClose: () => void;
  onOperate: (params: IADSApiLibraryOperationParams) => void;
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
    getValues,
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

  const handleOperate = () => {
    const { action, libs, source, target, name, desc, isPublic } = getValues();

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
        handleOnClose();
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
        handleOnClose();
        return;
      case 'empty':
        onOperate({ action: action, id: source });
        handleOnClose();
        return;
      default:
        handleOnClose();
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
            <form onSubmit={handleSubmit(handleOperate)}>
              <Flex direction="column" gap={4}>
                <FormControl>
                  <FormLabel>Action:</FormLabel>
                  <Controller
                    name="action"
                    control={control}
                    render={({ field: { ref, ...rest } }) => (
                      <RadioGroup {...rest}>
                        <Stack direction="row">
                          <Radio value="union" autoFocus>
                            Union
                          </Radio>
                          <Radio value="intersection">Intersection</Radio>
                          <Radio value="difference">Difference</Radio>
                          <Radio value="copy">Copy</Radio>
                          <Radio value="empty">Empty</Radio>
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
                      <Input {...register('name', { required: true })} />
                      <FormErrorMessage>{errors?.name && errors.name.message}</FormErrorMessage>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Description:</FormLabel>
                      <Textarea {...register('desc')} />
                    </FormControl>
                    <Checkbox {...register('isPublic')}>Make library public</Checkbox>
                  </>
                )}
                {(action === 'copy' || action === 'empty') && (
                  <FormControl isInvalid={!!errors?.source}>
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
                  <FormControl isInvalid={!!errors?.target}>
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
                <Button type="submit">Submit</Button>
                <Button variant="outline" onClick={handleOnClose}>
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

const LibrarySelector = ({
  isMultiple,
  onSelect,
  onDeselect,
}: {
  isMultiple: boolean;
  onSelect: (id: LibraryIdentifier) => void;
  onDeselect: (id: LibraryIdentifier) => void;
}) => {
  const [pageSize, setPageSize] = useState(10);

  const [pageIndex, setPageIndex] = useState(0);

  const [sort, setSort] = useState<ILibraryListTableSort>({ col: 'date_last_modified', dir: 'desc' });

  const [selected, setSelected] = useState<ILibraryMetadata[]>([]);

  const { isOpen, onClose, onToggle } = useDisclosure();

  const { data: librariesData, isLoading } = useGetLibraries({
    start: pageIndex * pageSize,
    rows: pageSize,
    sort: sort.col,
    order: sort.dir,
  });

  const libraries = useMemo(() => {
    if (librariesData) {
      return librariesData.libraries;
    }
  }, [librariesData]);

  // TODO: temp query to get all libraries so we can get count
  const { data: all } = useGetLibraries({}, { cacheTime: 0, staleTime: 0 });

  const entries = useMemo(() => {
    return all?.libraries ? all.libraries.length : 0;
  }, [all]); // TODO: get this using API (waiting for implementation)

  const handleSortChange = (sort: ILibraryListTableSort) => {
    setSort(sort);
    setPageIndex(0);
  };

  const handlePageIndexChange = (index: number) => {
    setPageIndex(index);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleSelectLibrary = (id: LibraryIdentifier) => {
    if (selected.findIndex((l) => l.id === id) === -1) {
      const lib = libraries.find((l) => l.id === id);
      setSelected((prev) => [...prev, lib]);
      onSelect(id);
    }
    onClose();
  };

  const handleRemoveSelect = (id: LibraryIdentifier) => {
    setSelected((prev) => prev.filter((l) => l.id !== id));
    onDeselect(id);
  };

  return (
    <>
      {isLoading ? (
        <TableSkeleton r={10} h="20px" />
      ) : (
        <>
          <Stack dir="column">
            {selected.map((l) => (
              <InputGroup key={l.name}>
                <Input value={l.name} isReadOnly />
                <InputRightElement>
                  <IconButton
                    icon={<CloseIcon />}
                    aria-label="Remove"
                    colorScheme="gray"
                    variant="ghosted"
                    size="xs"
                    onClick={() => handleRemoveSelect(l.id)}
                  />
                </InputRightElement>
              </InputGroup>
            ))}
            {(isMultiple || (!isMultiple && selected.length === 0)) && (
              <Input onClick={onToggle} placeholder="Select library" autoComplete="off" isReadOnly />
            )}
          </Stack>
          {isOpen && (
            <LibraryListTable
              libraries={libraries}
              entries={entries}
              sort={sort}
              pageSize={pageSize}
              pageIndex={pageIndex}
              showIndex={false}
              showDescription={false}
              hideCols={['public', 'num_users', 'permission', 'date_created']}
              onChangeSort={handleSortChange}
              onChangePageIndex={handlePageIndexChange}
              onChangePageSize={handlePageSizeChange}
              onLibrarySelect={handleSelectLibrary}
            />
          )}
        </>
      )}
    </>
  );
};
