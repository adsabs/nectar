import { ChangeEvent, useMemo, useState, useEffect } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  InputGroup,
  InputRightElement,
  IconButton,
  Tooltip,
  Box,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { Select } from '@/components/Select';
import { useSession } from '@/lib/useSession';
import { SimpleLink } from '@/components/SimpleLink';
import { useSettings } from '@/lib/useSettings';
import { DEFAULT_USER_DATA } from '@/api/user/models';

interface FormatOption {
  id: string;
  label: string;
  value: string;
  code: string;
}

export interface ICustomFormatSelectProps {
  customFormat: string;
  onCustomFormatChange: (customFormat: string) => void;
}

/**
 * Custom format selector with improved UX.
 *
 * Design: The input is always editable. The dropdown acts as a "template picker"
 * that populates the input when selected, but users can always modify the value.
 */
export const CustomFormatSelect = ({ customFormat, onCustomFormatChange }: ICustomFormatSelectProps) => {
  const { isAuthenticated } = useSession();
  const { settings: settingsData } = useSettings({ suspense: false });
  const { isOpen: showTemplates, onToggle: toggleTemplates } = useDisclosure();

  const customFormats = settingsData?.customFormats ?? DEFAULT_USER_DATA.customFormats;
  const hasSavedFormats = customFormats.length > 0;

  // Local editing state - synced with prop on mount
  const [editingCode, setEditingCode] = useState(customFormat);

  // Sync local state when prop changes from external source (e.g., URL)
  useEffect(() => {
    setEditingCode(customFormat);
  }, [customFormat]);

  // Build template options from saved formats
  const templateOptions: FormatOption[] = useMemo(() => {
    return customFormats
      .map((f) => ({
        id: f.id,
        label: f.name,
        value: f.id,
        code: f.code,
      }))
      .sort((a, b) => (a.label < b.label ? -1 : 1));
  }, [customFormats]);

  // Find if current code matches a saved template (for display purposes)
  const matchingTemplate = useMemo(() => {
    return templateOptions.find((opt) => opt.code === editingCode);
  }, [editingCode, templateOptions]);

  const handleTemplateSelect = (option: FormatOption) => {
    // Populate input with selected template's code
    setEditingCode(option.code);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingCode(e.target.value);
  };

  const handleSubmit = () => {
    if (editingCode.trim()) {
      onCustomFormatChange(editingCode.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editingCode.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <FormControl>
        <FormLabel htmlFor="custom-format-input">Custom Format String</FormLabel>
        <InputGroup size="md">
          <Input
            id="custom-format-input"
            placeholder="Enter format string (e.g., %1H:%Y:%q)"
            value={editingCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            fontFamily="mono"
            pr={hasSavedFormats && isAuthenticated ? '3rem' : undefined}
          />
          {hasSavedFormats && isAuthenticated && (
            <InputRightElement>
              <Tooltip label={showTemplates ? 'Hide saved templates' : 'Show saved templates'} placement="top">
                <IconButton
                  aria-label={showTemplates ? 'Hide templates' : 'Show templates'}
                  icon={showTemplates ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  size="sm"
                  variant="ghost"
                  onClick={toggleTemplates}
                />
              </Tooltip>
            </InputRightElement>
          )}
        </InputGroup>
        {matchingTemplate && (
          <Text fontSize="xs" color="gray.500" mt={1}>
            Using template: {matchingTemplate.label}
          </Text>
        )}
      </FormControl>

      {isAuthenticated && hasSavedFormats && (
        <Collapse in={showTemplates} animateOpacity>
          <Box mt={2}>
            <FormControl>
              <FormLabel fontSize="sm" color="gray.600">
                Quick fill from saved templates
              </FormLabel>
              <Select<FormatOption>
                label="Saved Templates"
                id="template-select"
                options={templateOptions}
                stylesTheme="default"
                value={matchingTemplate ?? null}
                placeholder="Select a template..."
                onChange={handleTemplateSelect}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
              />
            </FormControl>
          </Box>
        </Collapse>
      )}

      {isAuthenticated && (
        <Text fontSize="sm" color="gray.600">
          Manage saved formats in{' '}
          <SimpleLink href="/user/settings/export" display="inline" newTab>
            Export Settings
          </SimpleLink>
        </Text>
      )}

      <Button onClick={handleSubmit} width="full" isDisabled={!editingCode.trim()}>
        Submit
      </Button>

      <Text fontSize="sm">
        For format syntax help, see{' '}
        <SimpleLink href="/help/actions/export#the-ads-custom-format" display="inline">
          SciX Help
        </SimpleLink>
        .
      </Text>
    </>
  );
};
