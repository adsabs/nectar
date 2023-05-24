import { useOrcidSetPreferences } from '@api/orcid';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import {
  Card,
  CardBody,
  FormControl,
  FormLabel,
  InputGroup,
  Input,
  InputRightAddon,
  Text,
  useToast,
  Flex,
  Button,
} from '@chakra-ui/react';
import { useOrcid } from '@lib/orcid/useOrcid';
import { useState, useEffect, ChangeEvent } from 'react';

export const UserSettings = () => {
  const { user, preferences, logout } = useOrcid();

  const toast = useToast({ duration: 2000 });

  const [settings, setSettings] = useState({ submitChange: false, preferences: preferences });

  const [academicAffiliationInput, setAcademicAffiliationInput] = useState(preferences?.currentAffiliation ?? '');

  const [newAliasInput, setNewAliasInput] = useState('');

  const [aliasInputs, setAliasInputs] = useState(preferences?.nameVariations ?? []);

  // update settings when preference is changed
  useEffect(() => {
    if (settings?.preferences?.currentAffiliation) {
      setAcademicAffiliationInput(settings.preferences.currentAffiliation);
      setAliasInputs(settings.preferences.nameVariations);
    }
  }, [settings]);

  useOrcidSetPreferences(
    {
      user,
      preferences: settings.preferences,
    },
    {
      enabled: settings.submitChange,
      onSuccess: (data) => {
        toast({
          status: 'success',
          title: 'Update Successful',
        });
        setSettings({ submitChange: false, preferences: data });
      },
      onError: (error) => {
        toast({
          status: 'error',
          title: error.message,
        });
        setSettings((prev) => {
          return { submitChange: false, preferences: prev.preferences };
        });
      },
    },
  );

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
        <Text>{user?.orcid ?? ''}</Text>
        <FormControl mt={2}>
          <FormLabel>Academic Affiliation</FormLabel>
          <InputGroup>
            <Input onChange={handleChangeAcademicAffiliationInput} value={academicAffiliationInput} />
            <InputRightAddon
              children="submit"
              onClick={handleSubmitAffiliation}
              bgColor={academicAffiliationInput !== settings.preferences?.currentAffiliation ? 'blue.500' : 'gray.50'}
              color={academicAffiliationInput !== settings.preferences?.currentAffiliation ? 'white' : 'gray.200'}
              cursor={academicAffiliationInput !== settings.preferences?.currentAffiliation ? 'pointer' : 'cursor'}
            />
          </InputGroup>
        </FormControl>
        <FormControl mt={2}>
          <FormLabel>Aliases</FormLabel>
          {aliasInputs?.map((alias) => (
            <InputGroup key={`alise-${alias}`}>
              <Input defaultValue={alias} />
              <InputRightAddon onClick={() => handleDeleteAlias(alias)}>
                <DeleteIcon />
              </InputRightAddon>
            </InputGroup>
          ))}
          <InputGroup>
            <Input value={newAliasInput} onChange={handleChangeNewAliasInput} placeholder="Add new alias" />
            <InputRightAddon
              onClick={handleSubmitNewAlias}
              bgColor={newAliasInput !== '' ? 'blue.500' : 'gray.50'}
              color={newAliasInput !== '' ? 'white' : 'gray.200'}
              cursor={newAliasInput !== '' ? 'pointer' : 'cursor'}
            >
              <AddIcon />
            </InputRightAddon>
          </InputGroup>
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
