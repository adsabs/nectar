import { AddIcon, CheckIcon, CloseIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useOrcid } from '@lib/orcid/useOrcid';
import { OrcidLogo } from '@components/images';
import { ChangeEvent, useEffect, useState } from 'react';
import { useOrcidPrefs } from '@lib/orcid/useOrcidPrefs';

export const UserSettings = () => {
  const { user, preferences, logout } = useOrcid();

  const toast = useToast({ duration: 2000 });

  const [settings, setSettings] = useState({ submitChange: false, preferences: preferences });

  const [academicAffiliationInput, setAcademicAffiliationInput] = useState(preferences?.currentAffiliation ?? '');

  const [newAliasInput, setNewAliasInput] = useState('');

  const [aliasInputs, setAliasInputs] = useState(preferences?.nameVariations ?? []);

  // index of alias that is being edited
  const [editAlias, setEditAlias] = useState<{ index: number; value: string }>({ index: -1, value: null });

  // update settings when preference is changed
  useEffect(() => {
    if (settings?.preferences?.currentAffiliation) {
      setAcademicAffiliationInput(settings.preferences.currentAffiliation);
      setAliasInputs(settings.preferences.nameVariations);
    }
  }, [settings]);

  const { setPreferences } = useOrcidPrefs();

  // useOrcidSetPreferences(
  //   {
  //     user,
  //     preferences: settings.preferences,
  //   },
  //   {
  //     enabled: settings.submitChange,
  //     onSuccess: (data) => {
  //       toast({
  //         status: 'success',
  //         title: 'Update Successful',
  //       });
  //       setSettings({ submitChange: false, preferences: data });
  //     },
  //     onError: (error) => {
  //       toast({
  //         status: 'error',
  //         title: error.message,
  //       });
  //       setSettings((prev) => {
  //         return { submitChange: false, preferences: prev.preferences };
  //       });
  //     },
  //   },
  // );

  const handleChangeAcademicAffiliationInput = (e: ChangeEvent<HTMLInputElement>) => {
    setAcademicAffiliationInput(e.target.value);
  };

  const handleSubmitAffiliation = () => {
    if (academicAffiliationInput === settings.preferences?.currentAffiliation) {
      return;
    }
    setSettings((prev) => {
      return { submitChange: true, preferences: { ...prev.preferences, currentAffiliation: academicAffiliationInput } };
    });
  };

  const handleChangeNewAliasInput = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAliasInput(e.target.value);
  };

  const handleSubmitNewAlias = () => {
    if (newAliasInput === '') {
      return;
    }

    if (
      settings.preferences.nameVariations &&
      settings.preferences.nameVariations.find((name) => name === newAliasInput) !== undefined
    ) {
      toast({
        status: 'info',
        title: 'Alias already exists',
      });
      return;
    }

    setSettings((prev) => {
      return {
        submitChange: true,
        preferences: {
          ...prev.preferences,
          nameVariations: prev.preferences.nameVariations
            ? [...prev.preferences.nameVariations, newAliasInput]
            : [newAliasInput],
        },
      };
    });
    setNewAliasInput(''); // clear input field
  };

  // turn alias input to edit mode
  const handleEditAlias = (index: number) => {
    setEditAlias({ index, value: aliasInputs[index] });
  };

  // editing alias value is changed
  const handleEditingAliasChanged = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditAlias((prev) => ({ ...prev, value }));
  };

  const handleCancelEditAlias = () => {
    setEditAlias({ index: -1, value: null });
  };

  // submit edited alias
  const handleSubmitEditAlias = () => {
    setEditAlias({ index: -1, value: null });
    const nameVariations = [...settings.preferences.nameVariations];
    nameVariations[editAlias.index] = editAlias.value;
    setSettings((prev) => {
      return {
        submitChange: true,
        preferences: {
          ...prev.preferences,
          nameVariations,
        },
      };
    });
  };

  const handleDeleteAlias = (alias: string) => {
    setSettings((prev) => {
      return {
        submitChange: true,
        preferences: {
          ...prev.preferences,
          nameVariations: prev.preferences.nameVariations.filter((n) => n !== alias),
        },
      };
    });
  };

  return (
    <Card h="fit-content">
      <CardBody>
        <Text fontWeight="bold">{user?.name ?? ''}</Text>
        <HStack spacing={1}>
          <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
          <Text>{user?.orcid ?? ''}</Text>
        </HStack>
        <FormControl mt={4}>
          <FormLabel>Academic Affiliation</FormLabel>
          <HStack spacing={1}>
            <Input onChange={handleChangeAcademicAffiliationInput} value={academicAffiliationInput} />
            <IconButton
              aria-label="submit update"
              icon={<CheckIcon />}
              onClick={handleSubmitAffiliation}
              variant="outline"
              color="green.500"
              isDisabled={academicAffiliationInput === settings.preferences?.currentAffiliation}
            />
          </HStack>
        </FormControl>
        <FormControl mt={4}>
          <FormLabel>Aliases</FormLabel>
          {aliasInputs?.map((alias, index) => (
            <Box key={`alias-${alias}`} my={2}>
              {index === editAlias.index ? (
                <HStack spacing={1}>
                  <Input value={editAlias.value} onChange={handleEditingAliasChanged} />
                  <IconButton
                    aria-label="submit"
                    icon={<CheckIcon />}
                    onClick={handleSubmitEditAlias}
                    isDisabled={editAlias.value.length === 0}
                    variant="outline"
                    color="green.500"
                  />
                  <IconButton
                    aria-label="cancel"
                    icon={<CloseIcon />}
                    onClick={handleCancelEditAlias}
                    variant="outline"
                    color="red.500"
                  />
                </HStack>
              ) : (
                <HStack spacing={1}>
                  <Input value={alias} isReadOnly />
                  <IconButton
                    aria-label="edit"
                    icon={<EditIcon />}
                    onClick={() => handleEditAlias(index)}
                    variant="outline"
                  />
                  <IconButton
                    aria-label="delete"
                    icon={<DeleteIcon />}
                    onClick={() => handleDeleteAlias(alias)}
                    variant="outline"
                    color="red.500"
                  />
                </HStack>
              )}
            </Box>
          ))}
          <HStack spacing={1}>
            <Input value={newAliasInput} onChange={handleChangeNewAliasInput} placeholder="Add new alias" />
            <IconButton
              aria-label="submit new alias"
              icon={<AddIcon />}
              onClick={handleSubmitNewAlias}
              variant="outline"
              color="green.500"
              isDisabled={newAliasInput.length === 0}
            />
          </HStack>
        </FormControl>
        <Flex fontSize="sm" mt={10} justifyContent="end">
          <Button variant="link" onClick={logout}>
            Logout from ORCiD
          </Button>
        </Flex>
      </CardBody>
    </Card>
  );
};
