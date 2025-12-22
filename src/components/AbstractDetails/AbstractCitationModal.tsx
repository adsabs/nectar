import { useGetExportCitation } from '@/api/export/export';
import { ExportApiFormatKey, MostUsedExportFormats } from '@/api/export/types';
import { useExportFormats } from '@/lib/useExportFormats';
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
  Textarea,
} from '@chakra-ui/react';
import { useState } from 'react';
import { SimpleCopyButton } from '../CopyButton';
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

  const { formatOptions, getFormatOptionById } = useExportFormats();

  const options = formatOptions.filter((o) => o.type === 'HTML' || MostUsedExportFormats.includes(o.id));

  const defaultOption = settings.defaultCitationFormat
    ? getFormatOptionById(settings.defaultCitationFormat)
    : getFormatOptionById(ExportApiFormatKey.agu);

  const [selectedOption, setSelectedOption] = useState(defaultOption);

  const { data, isLoading, isError, error } = useGetExportCitation(
    {
      format: selectedOption.id,
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
          <Flex justifyContent="end" my={1}>
            <SimpleLink href={`/abs/${bibcode}/exportcitation/bibtex`} fontSize="sm" fontWeight="bold">
              Advanced options
            </SimpleLink>
          </Flex>
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
                {selectedOption.type === 'HTML' ? (
                  <>
                    <Box fontSize="sm" fontWeight="medium" dangerouslySetInnerHTML={{ __html: data.export }} />
                    <Flex justifyContent="end">
                      <SimpleCopyButton text={data.export} variant="outline" size="xs" asHtml />
                    </Flex>
                  </>
                ) : (
                  <>
                    <Textarea value={data.export} fontSize="sm" fontWeight="medium" mb={2} h={150} />
                    <Flex justifyContent="end">
                      <SimpleCopyButton text={data.export} variant="outline" size="xs" />
                    </Flex>
                  </>
                )}
              </>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
