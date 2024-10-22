import { CloseIcon } from '@chakra-ui/icons';
import { IconButton, Input, InputGroup, InputRightElement, Stack, useDisclosure } from '@chakra-ui/react';

import { NumPerPageType } from '@/types';
import { useMemo, useState } from 'react';
import { ILibraryListTableSort, LibraryListTable } from './LibraryListTable';
import { LoadingMessage } from '@/components/Feedbacks';
import { ILibraryMetadata, LibraryIdentifier } from '@/api/biblib/types';
import { useGetLibraries } from '@/api/biblib/libraries';

export const LibrarySelector = ({
  isMultiple,
  onSelect,
  onDeselect,
}: {
  isMultiple: boolean;
  onSelect: (id: LibraryIdentifier) => void;
  onDeselect: (id: LibraryIdentifier) => void;
}) => {
  const [pageSize, setPageSize] = useState<NumPerPageType>(10);

  const [pageIndex, setPageIndex] = useState(0);

  const [sort, setSort] = useState<ILibraryListTableSort>({ col: 'date_last_modified', dir: 'desc' });

  const [selected, setSelected] = useState<ILibraryMetadata[]>([]);

  const { isOpen, onClose, onToggle } = useDisclosure();

  const { data: librariesData, isLoading } = useGetLibraries(
    {
      start: pageIndex * pageSize,
      rows: pageSize,
      sort: sort.col,
      order: sort.dir,
    },
    { cacheTime: 0, staleTime: 0 },
  );

  const libraries = useMemo(() => {
    if (librariesData) {
      return librariesData.libraries;
    }
  }, [librariesData]);

  // TODO: temp query to get all libraries so we can get count
  const { data: all } = useGetLibraries({}, { cacheTime: 0, staleTime: 0 });

  const entries = useMemo(() => {
    return all?.libraries ? all.libraries.length : 0;
  }, [all]); // TODO: get this using API (waiting for implementation)

  const handleSortChange = (sort: ILibraryListTableSort) => {
    setSort(sort);
    setPageIndex(0);
  };

  const handlePageIndexChange = (index: number) => {
    setPageIndex(index);
  };

  const handlePageSizeChange = (size: NumPerPageType) => {
    setPageSize(size);
    setPageIndex(0);
  };

  const handleSelectLibrary = (id: LibraryIdentifier) => {
    if (selected.findIndex((l) => l.id === id) === -1) {
      const lib = libraries.find((l) => l.id === id);
      setSelected((prev) => [...prev, lib]);
      onSelect(id);
    }
    onClose();
  };

  const handleRemoveSelect = (id: LibraryIdentifier) => {
    setSelected((prev) => prev.filter((l) => l.id !== id));
    onDeselect(id);
  };

  return (
    <>
      {isLoading ? (
        <LoadingMessage message="Loading" />
      ) : (
        <>
          <Stack dir="column">
            {selected.map((l) => (
              <InputGroup key={l.name}>
                <Input value={l.name} isReadOnly />
                <InputRightElement>
                  <IconButton
                    icon={<CloseIcon />}
                    aria-label="Remove"
                    colorScheme="gray"
                    variant="ghost"
                    size="xs"
                    onClick={() => handleRemoveSelect(l.id)}
                  />
                </InputRightElement>
              </InputGroup>
            ))}
            {(isMultiple || (!isMultiple && selected.length === 0)) && (
              <Input
                onClick={onToggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggle();
                  }
                }}
                placeholder="Select library"
                autoComplete="off"
                isReadOnly
                data-testid="library-selector"
              />
            )}
          </Stack>
          {isOpen && (
            <LibraryListTable
              libraries={libraries}
              entries={entries}
              sort={sort}
              pageSize={pageSize}
              pageIndex={pageIndex}
              showIndex={false}
              showSettings={false}
              showDescription={false}
              hideCols={['public', 'num_users', 'permission', 'date_created']}
              onChangeSort={handleSortChange}
              onChangePageIndex={handlePageIndexChange}
              onChangePageSize={handlePageSizeChange}
              onLibrarySelect={handleSelectLibrary}
            />
          )}
        </>
      )}
    </>
  );
};
