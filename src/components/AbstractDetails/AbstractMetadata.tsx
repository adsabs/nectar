import { capitalizeString } from '@/utils/common/formatters';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { Flex, Icon, Tag, Tooltip } from '@chakra-ui/react';
import { DocumentIcon, PencilSquareIcon } from '@heroicons/react/20/solid';

export interface IAbstractMetadata {
  refereed: boolean;
  doctype: string;
  erratum: boolean;
}

export const AbstractMetadata = ({ refereed, doctype, erratum }: IAbstractMetadata) => {
  return (
    <Flex as="section" wrap="wrap" gap={2} align="center" aria-label="Article metadata">
      {refereed && (
        <Tooltip label="Refereed">
          <Tag fontWeight="bold" colorScheme="green" variant="outline">
            <CheckCircleIcon mr={1} />
            Refereed
          </Tag>
        </Tooltip>
      )}
      {doctype && (
        <Tooltip label={`Doctype: ${doctype}`}>
          <Tag fontWeight="bold" colorScheme="gray" variant="outline">
            <Icon as={DocumentIcon} mr={1} />
            {`${capitalizeString(doctype)}`}
          </Tag>
        </Tooltip>
      )}
      {erratum && (
        <Tooltip label="Erratum">
          <Tag fontWeight="bold" colorScheme="red" variant="outline">
            <Icon as={PencilSquareIcon} mr={1} />
            Erratum
          </Tag>
        </Tooltip>
      )}
    </Flex>
  );
};
