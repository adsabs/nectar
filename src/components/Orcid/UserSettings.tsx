import { AddIcon, CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  ButtonProps,
  Card,
  CardBody,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  SkeletonText,
  Stack,
  Text,
  useBreakpointValue,
  useDisclosure,
  useEditableControls,
  VisuallyHidden,
} from '@chakra-ui/react';
import { useOrcid } from '@/lib/orcid/useOrcid';
import { OrcidLogo } from '@/components/images';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useOrcidPrefs } from '@/lib/orcid/useOrcidPrefs';

import { isValidIOrcidUser } from '@/api/orcid/models';
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { remove, update } from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import escapeHtml from 'escape-html';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { getFallBackAlert } from '@/components/Feedbacks/SuspendedAlert';

import { SearchQueryLink, SearchQueryLinkButton } from '@/components/SearchQueryLink';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { noop } from '@/utils/common/noop';

export const UserSettings = () => {
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const { background } = useColorModeColors();

  const body = (
    <>
      <OrcidHeader />
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            fallbackRender={getFallBackAlert({
              status: 'warning',
              label: 'Unable to load settings',
            })}
            onReset={reset}
          >
            <Suspense fallback={<UserSettingSkeleton />}>
              <form onSubmit={noop}>
                <FormControl mt={4}>
                  <FormLabel htmlFor="aff-editor">Academic Affiliation</FormLabel>
                  <AffiliationEditor id="aff-editor" />
                </FormControl>
                <FormControl mt={4}>
                  <FormLabel>Aliases</FormLabel>
                  <AliasList />
                </FormControl>
              </form>
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
      <Flex fontSize="sm" mt={10} justifyContent="end">
        <LogoutButton />
      </Flex>
    </>
  );

  if (isMobile) {
    return body;
  }

  return (
    <Card h="fit-content" backgroundColor={background}>
      <CardBody>{body}</CardBody>
    </Card>
  );
};

const UserSettingSkeleton = () => {
  return (
    <>
      <FormControl mt={4}>
        <FormLabel>Academic Affiliation</FormLabel>
        <SkeletonText />
      </FormControl>
      <FormControl mt={4}>
        <FormLabel>Aliases</FormLabel>
        <SkeletonText />
      </FormControl>
    </>
  );
};

const MAX_ALIAS_INPUT_LENGTH = 70;
const MAX_AFF_INPUT_LENGTH = 100;

const AliasEditableControls = (props: { name: string; index: number }) => {
  const { name, index } = props;
  const { getEditButtonProps, getSubmitButtonProps, getCancelButtonProps, isEditing } = useEditableControls();
  const { preferences, setPreferences } = useOrcidPrefs({ getPrefsOptions: { suspense: true } });
  const { onOpen, onClose, isOpen } = useDisclosure();
  const initRef = useRef<HTMLButtonElement>(null);

  const handleRemove = useCallback(() => {
    if (isNotNilOrEmpty(preferences) && isNotNilOrEmpty(preferences.nameVariations)) {
      setPreferences({ preferences: { ...preferences, nameVariations: remove(index, 1, preferences.nameVariations) } });
    }
    onClose();
  }, [preferences, setPreferences, index, onClose]);

  if (isEditing) {
    return (
      <ButtonGroup>
        <IconButton
          variant="outline"
          colorScheme="green"
          icon={<CheckIcon />}
          size="xs"
          aria-label="submit changes to affiliation"
          {...getSubmitButtonProps()}
        />
        <IconButton
          variant="outline"
          colorScheme="red"
          size="xs"
          icon={<XMarkIcon />}
          aria-label="submit changes to affiliation"
          {...getCancelButtonProps()}
        />
      </ButtonGroup>
    );
  }

  return (
    <ButtonGroup>
      <IconButton
        variant="outline"
        icon={<EditIcon />}
        size="xs"
        aria-label="edit affiliation"
        {...getEditButtonProps()}
      />
      <Popover
        closeOnBlur
        placement="right"
        initialFocusRef={initRef}
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
      >
        <PopoverTrigger>
          <IconButton
            variant="outline"
            colorScheme="red"
            icon={<Icon as={TrashIcon} />}
            size="xs"
            aria-label={`remove alias ${name}`}
          />
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverBody>
            <Text>Are you sure you want to remove this alias?</Text>
            <ButtonGroup mt={4}>
              <Button ref={initRef} variant="outline" colorScheme="green" onClick={handleRemove}>
                Yes
              </Button>
              <Button variant="outline" colorScheme="gray" onClick={onClose}>
                No
              </Button>
            </ButtonGroup>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  );
};

const AffEditableControls = () => {
  const { getEditButtonProps, getSubmitButtonProps, getCancelButtonProps, isEditing } = useEditableControls();

  if (isEditing) {
    return (
      <ButtonGroup>
        <IconButton
          variant="outline"
          colorScheme="green"
          icon={<CheckIcon />}
          size="xs"
          aria-label="submit changes to affiliation"
          {...getSubmitButtonProps()}
        />
        <IconButton
          variant="outline"
          colorScheme="red"
          size="xs"
          icon={<XMarkIcon />}
          aria-label="submit changes to affiliation"
          {...getCancelButtonProps()}
        />
      </ButtonGroup>
    );
  }
  return (
    <IconButton
      variant="outline"
      size="xs"
      icon={<EditIcon />}
      aria-label="edit affiliation"
      {...getEditButtonProps()}
    />
  );
};

const AffiliationEditor = ({ id }: { id: string }) => {
  const { preferences, setPreferences } = useOrcidPrefs({ getPrefsOptions: { suspense: true } });

  const handleOnChange = useCallback(
    (affiliation: string) => {
      const cleanAffiliation = escapeHtml(affiliation.trim());

      if (isNotNilOrEmpty(cleanAffiliation) && preferences.currentAffiliation === affiliation) {
        return;
      }

      if (isNotNilOrEmpty(preferences)) {
        setPreferences({ preferences: { ...preferences, currentAffiliation: cleanAffiliation } });
      }
    },
    [setPreferences, preferences],
  );

  return (
    <Editable
      defaultValue={preferences?.currentAffiliation}
      isPreviewFocusable={false}
      onSubmit={handleOnChange}
      submitOnBlur
      id={id}
    >
      <Flex gap={4} alignItems="center">
        <EditablePreview flex={1} />
        <EditableInput maxLength={MAX_AFF_INPUT_LENGTH} />
        <AffEditableControls />
      </Flex>
    </Editable>
  );
};

const AliasList = () => {
  const { preferences } = useOrcidPrefs({ getPrefsOptions: { suspense: true } });

  return (
    <>
      {preferences?.nameVariations?.length === 0 ? (
        <Box my={1}>
          <Text>No aliases found</Text>
        </Box>
      ) : null}
      {preferences?.nameVariations?.map((name, index) => (
        <Box my={1} key={name}>
          <AliasEditor name={name} index={index} />
        </Box>
      ))}
      <AddNewAliasButton />
    </>
  );
};

const AddNewAliasButton = () => {
  const { preferences, setPreferences } = useOrcidPrefs({ getPrefsOptions: { suspense: true } });
  const [name, setName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleAddNew = useCallback(() => {
    const cleanName = escapeHtml(name.trim());

    // if already there, warn about it
    if (preferences.nameVariations?.includes(cleanName)) {
      setError('Alias already exists');
      return;
    }

    // check if name/prefs are empty, and that the name isn't already there
    if (isNotNilOrEmpty(preferences) && isNotNilOrEmpty(name)) {
      setPreferences({
        preferences: {
          ...preferences,
          nameVariations: preferences.nameVariations ? [...preferences.nameVariations, name] : [name],
        },
      });
      setAddingNew(false);
      setName('');
    }
  }, [name, preferences, setPreferences]);

  // focus input
  useEffect(() => {
    if (addingNew && ref.current) {
      ref.current.focus();
    }
  }, [addingNew, ref.current]);

  // on name change, clear error
  useEffect(() => setError(null), [name]);

  if (addingNew) {
    return (
      <FormControl isInvalid={!!error}>
        <FormLabel>
          <VisuallyHidden>Add new alias</VisuallyHidden>
        </FormLabel>
        <Flex gap={4} mt={4} alignItems="center">
          <Input
            type="text"
            flex={1}
            placeholder="Add new alias"
            onChange={(e) => setName(e.currentTarget.value)}
            onKeyDown={(e) => (e.key === 'Enter' ? handleAddNew() : undefined)}
            maxLength={MAX_ALIAS_INPUT_LENGTH}
            value={name}
            ref={ref}
          />
          <ButtonGroup>
            <IconButton
              onClick={handleAddNew}
              variant="outline"
              colorScheme="green"
              icon={<AddIcon />}
              aria-label="Add new alias"
              size="xs"
            />
            <IconButton
              onClick={() => setAddingNew(false)}
              variant="outline"
              colorScheme="red"
              aria-label="cancel add new alias"
              icon={<CloseIcon />}
              size="xs"
            />
          </ButtonGroup>
        </Flex>
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>
    );
  }

  const wrapName = (name: string) => `"${name}"`;

  return (
    <Stack mt="2">
      <Button
        size="sm"
        onClick={() => setAddingNew(true)}
        variant="outline"
        colorScheme="green"
        rightIcon={<Icon fontWeight="bold" fontSize="18" as={PlusIcon} />}
        aria-label="Add new alias"
        w={['full', 'auto']}
      >
        Add new alias
      </Button>
      <SearchQueryLinkButton
        size="sm"
        variant="outline"
        w={['full', 'auto']}
        rightIcon={<Icon fontSize="14" as={MagnifyingGlassIcon} />}
        params={{ q: `author:(${preferences?.nameVariations?.map(wrapName).join(' OR ')})` }}
        isDisabled={!preferences?.nameVariations || preferences?.nameVariations.length === 0}
      >
        <>{preferences?.nameVariations?.length > 1 ? 'Search by aliases' : 'Search by alias'}</>
      </SearchQueryLinkButton>
    </Stack>
  );
};

const AliasEditor = (props: { name: string; index: number }) => {
  const { name, index } = props;
  const { preferences, setPreferences } = useOrcidPrefs({ getPrefsOptions: { suspense: true } });

  const handleOnChange = useCallback(
    (name: string) => {
      const cleanName = escapeHtml(name.trim());

      // if name is empty or equal to the one we're updating, don't update
      if (isNotNilOrEmpty(cleanName) || preferences.nameVariations[index] === cleanName) {
        return;
      }

      if (isNotNilOrEmpty(preferences)) {
        setPreferences({
          preferences: {
            ...preferences,
            nameVariations: update(index, cleanName, preferences.nameVariations),
          },
        });
      }
    },
    [setPreferences, preferences, index],
  );

  return (
    <Editable defaultValue={name} onSubmit={handleOnChange} submitOnBlur isPreviewFocusable={false}>
      <Flex gap={4} alignItems="center">
        <EditablePreview flex={1} />
        <EditableInput maxLength={MAX_ALIAS_INPUT_LENGTH} />
        <AliasEditableControls name={name} index={index} />
      </Flex>
    </Editable>
  );
};

const OrcidHeader = () => {
  const { user } = useOrcid();

  if (!isValidIOrcidUser(user)) {
    return null;
  }

  return (
    <>
      <Text fontWeight="bold">{user?.name}</Text>
      <HStack spacing={2}>
        <OrcidLogo fontSize="18px" aria-hidden />
        <SearchQueryLink params={{ q: `orcid:${user?.orcid}` }}>{user?.orcid}</SearchQueryLink>
      </HStack>
    </>
  );
};

const LogoutButton = (props: ButtonProps) => {
  const { logout } = useOrcid();
  const variant = useBreakpointValue({ base: 'solid', lg: 'link' });

  return (
    <Button variant={variant} w={['full', 'auto']} onClick={logout} {...props}>
      Logout from ORCiD
    </Button>
  );
};
