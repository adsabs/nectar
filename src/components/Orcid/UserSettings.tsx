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

  const [academicAffiliationInput, setAcademicAffiliationInput] = useState(preferences?.currentAffiliation ?? '');

  const [newAliasInput, setNewAliasInput] = useState('');

  const [aliasInputs, setAliasInputs] = useState(preferences?.nameVariations ?? []);

  // index of alias that is being edited
  const [editAlias, setEditAlias] = useState<{ index: number; value: string }>({ index: -1, value: null });

  // update fields when preference is changed
  useEffect(() => {
    if (preferences?.currentAffiliation) {
      setAcademicAffiliationInput(preferences.currentAffiliation);
    }
    if (preferences?.nameVariations) {
      setAliasInputs(preferences.nameVariations);
    }
  }, [preferences]);

  const { setPreferences, setPreferencesState } = useOrcidPrefs();

  // set preference successful or failed
  useEffect(() => {
    if (setPreferencesState.isSuccess) {
      toast({
        status: 'success',
        title: 'Successfully updated',
      });
    }
    if (setPreferencesState.isError) {
      toast({
        status: 'error',
        title: 'Update failed',
      });
    }
  }, [setPreferencesState.isSuccess, setPreferencesState.error, setPreferencesState.data]);

  const handleChangeAcademicAffiliationInput = (e: ChangeEvent<HTMLInputElement>) => {
    setAcademicAffiliationInput(e.target.value);
  };

  const handleSubmitAffiliation = () => {
    if (academicAffiliationInput === preferences?.currentAffiliation) {
      return;
    }
    setPreferences({ preferences: { ...preferences, currentAffiliation: academicAffiliationInput } });
  };

  const handleChangeNewAliasInput = (e: ChangeEvent<HTMLInputElement>) => {
    setNewAliasInput(e.target.value);
  };

  const handleSubmitNewAlias = () => {
    if (newAliasInput === '') {
      return;
    }

    // return if alias already exists
    if (preferences.nameVariations && preferences.nameVariations.find((name) => name === newAliasInput) !== undefined) {
      toast({
        status: 'info',
        title: 'Alias already exists',
      });
      return;
    }

    setPreferences({
      preferences: {
        ...preferences,
        nameVariations: preferences.nameVariations ? [...preferences.nameVariations, newAliasInput] : [newAliasInput],
      },
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
    const nameVariations = [...preferences.nameVariations];
    nameVariations[editAlias.index] = editAlias.value;
    setPreferences({
      preferences: {
        ...preferences,
        nameVariations,
      },
    });
  };

  const handleDeleteAlias = (alias: string) => {
    setPreferences({
      preferences: {
        ...preferences,
        nameVariations: preferences.nameVariations.filter((n) => n !== alias),
      },
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
              isDisabled={academicAffiliationInput === preferences?.currentAffiliation}
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
