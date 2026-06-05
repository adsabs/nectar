import { useColorModeColors } from '@/lib/useColorModeColors';
import { kFormatNumber } from '@/utils/common/formatters';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Flex,
  Table,
  Tbody,
  Tr,
  Td,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { ControlledPaginationControls } from '../Pagination';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { APP_DEFAULTS } from '@/config';
import { NumPerPageType } from '@/types';
import { useDebounce } from '@/lib/useDebounce';
import { CloseIcon } from '@chakra-ui/icons';

const extractFacetVal = (key: string) => {
  return key.split('/').pop();
};

export const ViewCollectionModal = ({
  label,
  data,
  isOpen,
  onClose,
  onSelectFacet,
}: {
  label: string;
  data: { val: number | string; count: number }[];
  isOpen: boolean;
  onClose: () => void;
  onSelectFacet: (id: string) => void;
}) => {
  const colors = useColorModeColors();

  const [pageIndex, setPageIndex] = useState(0);

  const [pageSize, setPageSize] = useState<number>(APP_DEFAULTS.RESULT_PER_PAGE);

  const [searchTerm, setSearchTerm] = useState<string>('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) {
      return data;
    }
    return data.filter((d) =>
      extractFacetVal(d.val as string)
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()),
    );
  }, [data, debouncedSearchTerm]);

  const pageData = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pageIndex, pageSize]);

  useEffect(() => {
    setPageIndex(0);
  }, [debouncedSearchTerm]);

  const onChangePageIndex = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const onChangePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // Reset to first page when page size changes
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleOnClose = () => {
    setSearchTerm('');
    setPageIndex(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleOnClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{label}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" gap={4} h="600px">
            <InputGroup>
              <Input
                placeholder={`Search within ${label.toLowerCase()}`}
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <InputRightElement>
                <IconButton
                  aria-label="clear search"
                  icon={<CloseIcon />}
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  visibility={searchTerm ? 'visible' : 'hidden'}
                  variant="ghost"
                />
              </InputRightElement>
            </InputGroup>
            <Flex direction="column" gap={4}>
              {pageData.map((d) => (
                <Table key={d.val} variant="simple" size="sm">
                  <Tbody>
                    <Tr
                      cursor="pointer"
                      _hover={{ backgroundColor: colors.highlightBackground, color: colors.highlightForeground }}
                      onClick={() => onSelectFacet(d.val as string)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onSelectFacet(d.val as string);
                        }
                      }}
                    >
                      <Td>{extractFacetVal(d.val as string)}</Td>
                      <Td isNumeric>{kFormatNumber(d.count)}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              ))}
            </Flex>
            <ControlledPaginationControls
              entries={filteredData.length}
              pageIndex={pageIndex}
              pageSize={pageSize as NumPerPageType}
              onChangePageSize={onChangePageSize}
              onChangePageIndex={onChangePageIndex}
              py={4}
              compact
            />
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
