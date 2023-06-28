import { CheckIcon, EditIcon } from '@chakra-ui/icons';
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
  Skeleton,
  Text,
  useDisclosure,
  useEditableControls,
  VisuallyHidden,
} from '@chakra-ui/react';
import { useOrcid } from '@lib/orcid/useOrcid';
import { OrcidLogo } from '@components/images';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOrcidPrefs } from '@lib/orcid/useOrcidPrefs';
import { SearchQueryLink } from '@components';
import { isValidIOrcidUser } from '@api/orcid/models';
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { remove, update } from 'ramda';
import { isNotNilOrEmpty } from 'ramda-adjunct';
import { noop } from '@utils';
import escapeHtml from 'escape-html';

export const UserSettings = () => {
  return (
    <Card h="fit-content">
      <CardBody>
        <OrcidHeader />
        <form onSubmit={noop}>
          <FormControl mt={4}>
            <FormLabel>Academic Affiliation</FormLabel>
            <AffiliationEditor />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Aliases</FormLabel>
            <AliasList />
          </FormControl>
        </form>
        <Flex fontSize="sm" mt={10} justifyContent="end">
          <LogoutButton />
        </Flex>
      </CardBody>
    </Card>
  );
};

const MAX_ALIAS_INPUT_LENGTH = 70;
const MAX_AFF_INPUT_LENGTH = 100;

const AliasEditableControls = (props: { name: string; index: number }) => {
  const { name, index } = props;
  const { getEditButtonProps, getSubmitButtonProps, getCancelButtonProps, isEditing } = useEditableControls();
  const { preferences, setPreferences } = useOrcidPrefs();
  const { onOpen, onClose, isOpen } = useDisclosure();
  const initRef = useRef<HTMLButtonElement>(null);

  const handleRemove = useCallback(() => {
    if (isNotNilOrEmpty(preferences)) {
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
        colorScheme="gray"
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
      colorScheme="gray"
      size="xs"
      icon={<EditIcon />}
      aria-label="edit affiliation"
      {...getEditButtonProps()}
    />
  );
};

const AffiliationEditor = () => {
  const { preferences, setPreferences, getPreferencesState } = useOrcidPrefs();

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
    <Skeleton isLoaded={!getPreferencesState.isLoading}>
      <Editable
        defaultValue={preferences?.currentAffiliation}
        isPreviewFocusable={false}
        onSubmit={handleOnChange}
        submitOnBlur
      >
        <Flex gap={4} alignItems="center">
          <EditablePreview flex={1} />
          <EditableInput maxLength={MAX_AFF_INPUT_LENGTH} />
          <AffEditableControls />
        </Flex>
      </Editable>
    </Skeleton>
  );
};

const AliasList = () => {
  const { preferences, getPreferencesState } = useOrcidPrefs();

  return (
    <Skeleton isLoaded={!getPreferencesState.isLoading}>
      {preferences?.nameVariations.length === 0 ? (
        <Box my={1}>
          <Text>No aliases found</Text>
        </Box>
      ) : null}
      {preferences?.nameVariations.map((name, index) => (
        <Box my={1} key={name}>
          <AliasEditor name={name} index={index} />
        </Box>
      ))}

      <AddNewAliasButton />
    </Skeleton>
  );
};

const AddNewAliasButton = () => {
  const { preferences, setPreferences } = useOrcidPrefs();
  const [name, setName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handleAddNew = useCallback(() => {
    const cleanName = escapeHtml(name.trim());

    // if already there, warn about it
    if (preferences.nameVariations.includes(cleanName)) {
      setError('Alias already exists');
      return;
    }

    // check if name/prefs are empty, and that the name isn't already there
    if (isNotNilOrEmpty(preferences) && isNotNilOrEmpty(name)) {
      setPreferences({
        preferences: {
          ...preferences,
          nameVariations: [...preferences.nameVariations, name],
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
              icon={<Icon fontWeight="bold" fontSize="18" as={PlusIcon} />}
              aria-label="Add new alias"
            />
            <IconButton
              onClick={() => setAddingNew(false)}
              variant="outline"
              colorScheme="red"
              aria-label="cancel add new alias"
              icon={<Icon as={XMarkIcon} />}
            />
          </ButtonGroup>
        </Flex>
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>
    );
  }

  const wrapName = (name: string) => `"${name}"`;

  return (
    <ButtonGroup>
      <Button
        size="sm"
        onClick={() => setAddingNew(true)}
        variant="outline"
        colorScheme="green"
        rightIcon={<Icon fontWeight="bold" fontSize="18" as={PlusIcon} />}
        aria-label="Add new alias"
      >
        Add alias
      </Button>
      <SearchQueryLink params={{ q: `author:(${preferences?.nameVariations.map(wrapName).join(' OR ')})` }}>
        <Button size="sm" variant="outline" rightIcon={<Icon fontSize="14" as={MagnifyingGlassIcon} />}>
          {preferences?.nameVariations.length > 1 ? 'Search by aliases' : 'Search by alias'}
        </Button>
      </SearchQueryLink>
    </ButtonGroup>
  );
};

const AliasEditor = (props: { name: string; index: number }) => {
  const { name, index } = props;
  const { preferences, setPreferences } = useOrcidPrefs();

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
      <HStack spacing={1}>
        <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
        <SearchQueryLink params={{ q: `orcid:${user?.orcid}` }}>
          <>{user?.orcid}</>
        </SearchQueryLink>
      </HStack>
    </>
  );
};

const LogoutButton = (props: ButtonProps) => {
  const { logout } = useOrcid();

  return (
    <Button variant="link" onClick={logout} {...props}>
      Logout from ORCiD
    </Button>
  );
};
