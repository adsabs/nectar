import { useGetExportCitation } from '@/api/export/export';
import { getBibtexExportParams } from '@/api/export/getBibtexExportParams';
import { ExportApiFormatKey, MostUsedExportFormats } from '@/api/export/types';
import { useExportFormats } from '@/lib/useExportFormats';
import { useSession } from '@/lib/useSession';
import { useSettings } from '@/lib/useSettings';
import { parseAPIError } from '@/utils/common/parseAPIError';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Divider,
  Flex,
  Icon,
  Text,
  Textarea,
  Tooltip,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { LabeledCopyButton } from '../CopyButton';
import { LoadingMessage } from '../Feedbacks';
import { Select } from '../Select';
import { SimpleLink } from '../SimpleLink';

export const AbstractCitationModal = ({
  isOpen,
  onClose,
  bibcode,
}: {
  isOpen: boolean;
  onClose: () => void;
  bibcode: string;
}) => {
  const { settings } = useSettings();

  const { isAuthenticated } = useSession();

  const { formatOptions, getFormatOptionById } = useExportFormats();

  const options = formatOptions.filter((o) => MostUsedExportFormats.includes(o.id));

  const defaultOption = settings.defaultCitationFormat
    ? getFormatOptionById(settings.defaultCitationFormat)
    : getFormatOptionById(ExportApiFormatKey.agu);

  const [selectedOption, setSelectedOption] = useState(defaultOption);

  // Reset to the user's saved default each time the modal opens, since useState
  // only captures the initial value at mount and settings may load asynchronously.
  useEffect(() => {
    if (isOpen) {
      setSelectedOption(
        settings.defaultCitationFormat
          ? getFormatOptionById(settings.defaultCitationFormat)
          : getFormatOptionById(ExportApiFormatKey.agu),
      );
    }
  }, [isOpen, settings.defaultCitationFormat, getFormatOptionById]);

  const { data, isLoading, isError, error } = useGetExportCitation(
    {
      format: selectedOption.id,
      bibcode: [bibcode],
      ...getBibtexExportParams(settings, selectedOption.id),
    },
    { enabled: !!bibcode && isOpen },
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="2xl">Citation</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Text fontSize="sm" color="gray.500" mb={6}>
            Copy and paste a citation for this record.
          </Text>
          <Select
            name="format"
            label="Format"
            id="citation-format-selector"
            options={options}
            value={selectedOption}
            onChange={(o) => setSelectedOption(o)}
            stylesTheme="default.sm"
          />
          <Box mt={6} mb={8}>
            {isLoading ? (
              <LoadingMessage message="Loading" />
            ) : isError ? (
              <Alert status="error">
                <AlertIcon />
                <AlertTitle>Error fetching citation!</AlertTitle>
                <AlertDescription>{parseAPIError(error)}</AlertDescription>
              </Alert>
            ) : (
              <>
                {selectedOption.type === 'HTML' ? (
                  <Box fontSize="sm" fontWeight="medium" dangerouslySetInnerHTML={{ __html: data.export }} />
                ) : (
                  <Textarea value={data.export} fontSize="sm" fontWeight="medium" h={200} isReadOnly />
                )}
                <Flex justifyContent="end" mt={4}>
                  <LabeledCopyButton
                    label="Copy"
                    text={data.export}
                    asHtml={selectedOption.type === 'HTML'}
                    colorScheme="blue"
                    variant="solid"
                  />
                </Flex>
              </>
            )}
          </Box>
          <Divider />
          <Flex justifyContent="space-between" alignItems="flex-start" mt={6}>
            <SimpleLink
              href={`/abs/${bibcode}/exportcitation/bibtex`}
              icon={<Icon as={ArrowTopRightOnSquareIcon} boxSize={4} mr={1} />}
              display="flex"
              alignItems="center"
              fontSize="sm"
              fontWeight="bold"
            >
              More export options
            </SimpleLink>
            {isAuthenticated ? (
              <SimpleLink
                href="/user/settings/export?tab=3"
                icon={<SettingsIcon mr={1} />}
                display="flex"
                alignItems="center"
                fontSize="sm"
                fontWeight="bold"
              >
                Copy citation settings
              </SimpleLink>
            ) : (
              <Tooltip label="Create an account to manage Copy Citation settings" shouldWrapChildren>
                <Button variant="link" size="sm" leftIcon={<SettingsIcon />} isDisabled>
                  Copy citation settings
                </Button>
              </Tooltip>
            )}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
