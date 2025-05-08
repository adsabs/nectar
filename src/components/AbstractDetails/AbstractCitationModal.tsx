import { useGetExportCitation } from '@/api/export/export';
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
  Flex,
} from '@chakra-ui/react';
import { values } from 'ramda';
import { useState } from 'react';
import { citationFormats, ExportFormat } from '../CitationExporter';
import { SimpleCopyButton } from '../CopyButton';
import { LoadingMessage } from '../Feedbacks';
import { Select } from '../Select';

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

  const options = values(citationFormats);

  const defaultOption = settings.defaultCitationFormat
    ? options.find((option) => option.value === settings.defaultCitationFormat)
    : options.find((option) => option.id === 'agu');

  const [selectedOption, setSelectedOption] = useState(defaultOption);

  const { data, isLoading, isError, error } = useGetExportCitation(
    {
      format: selectedOption.id as ExportFormat['id'],
      bibcode: [bibcode],
    },
    { enabled: !!bibcode && isOpen },
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Citation</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Select
            name="format"
            label="Citation Format"
            hideLabel
            id="citation-format-selector"
            options={options}
            value={selectedOption}
            onChange={(o) => setSelectedOption(o)}
            stylesTheme="default.sm"
          />
          <Box my={6}>
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
                <Box fontSize="sm" fontWeight="medium" dangerouslySetInnerHTML={{ __html: data.export }} />
                <Flex justifyContent="end">
                  <SimpleCopyButton text={data.export} variant="outline" size="xs" asHtml />
                </Flex>
              </>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
