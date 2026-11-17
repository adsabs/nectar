import { useGetExportCitation } from '@/api/export/export';
import { getBibtexExportParams } from '@/api/export/getBibtexExportParams';
import { ExportApiFormatKey, MostUsedExportFormats } from '@/api/export/types';
import { useCitationFormat } from '@/lib/useCitationFormat';
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
import { useEffect, useMemo, useState } from 'react';
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

  const { format } = useCitationFormat();

  const { formatOptions, getFormatOptionById } = useExportFormats();

  const options = useMemo(() => formatOptions.filter((o) => MostUsedExportFormats.includes(o.id)), [formatOptions]);

  const defaultOption = options.some((o) => o.id === format.id)
    ? getFormatOptionById(format.id)
    : getFormatOptionById(ExportApiFormatKey.agu);

  const [selectedOption, setSelectedOption] = useState(defaultOption);

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(
        options.some((o) => o.id === format.id)
          ? getFormatOptionById(format.id)
          : getFormatOptionById(ExportApiFormatKey.agu),
      );
    }
  }, [isOpen, format.id, options, getFormatOptionById]);

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
              href={`/abs/${encodeURIComponent(bibcode)}/exportcitation/${format.id}`}
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
                href="/user/settings/export"
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
