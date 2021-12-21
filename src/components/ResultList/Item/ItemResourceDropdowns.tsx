import { ReactElement, MouseEvent } from 'react';
import { IDocsEntity } from '@api';
import { processLinkData } from '@components/AbstractSources/linkGenerator';
import { DatabaseIcon, DocumentTextIcon, ViewListIcon } from '@heroicons/react/outline';
import { IconButton } from '@chakra-ui/button';
import { Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/menu';
import { isBrowser } from '@utils';
import { useRouter } from 'next/router';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';

export interface IItemResourceDropdownsProps {
  doc: IDocsEntity;
}

interface IItem {
  id: string;
  label: ReactElement | string;
  path?: string;
}

export const ItemResourceDropdowns = ({ doc }: IItemResourceDropdownsProps): ReactElement => {
  const router = useRouter();

  let fullSourceItems: IItem[] = [];

  let dataProductItems: IItem[] = [];

  // full text resources and data products
  if (doc.esources) {
    const sources = processLinkData(doc, null);

    const fullTextSources = sources.fullTextSources;

    const dataProducts = sources.dataProducts;

    fullSourceItems = fullTextSources.map((source) => ({
      text: source.name,
      label: source.open ? (
        <>
          <UnlockIcon color="green.600" mr={1} />
          {` ${source.name}`}
        </>
      ) : (
        <>
          <LockIcon mr={1} />
          {` ${source.name}`}
        </>
      ),
      path: source.url,
      id: `fullText-${source.name}`,
      newTab: true,
    }));

    dataProductItems = dataProducts.map((dp) => ({
      text: dp.name,
      label: dp.name,
      path: dp.url,
      id: `dataProd-${dp.name}`,
      newTab: true,
    }));
  }

  // citations and references

  const num_references =
    doc['[citations]'] && typeof doc['[citations]'].num_references === 'number' ? doc['[citations]'].num_references : 0;

  const num_citations =
    doc['[citations]'] && typeof doc['[citations]'].num_citations === 'number' ? doc['[citations]'].num_citations : 0;

  const referenceItems: IItem[] = [];
  if (num_citations > 0) {
    referenceItems.push({
      id: `ref-dropdown-cit-${doc.bibcode}`,
      label: `Citations (${num_citations})`,
      path: `/abs/${doc.bibcode}/citations`,
    });
  }

  if (num_references > 0) {
    referenceItems.push({
      id: `ref-dropdown-ref-${doc.bibcode}`,
      label: `References (${num_references})`,
      path: `/abs/${doc.bibcode}/references`,
    });
  }

  const handleResourceClick = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      window.open(fullSourceItems.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer');
    }
  };

  const handleReferenceClick = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      void router.push(referenceItems.find((item) => id === item.id).path);
    }
  };

  const handleDataProductClick = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      window.open(dataProductItems.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* full resources menu */}
      <Menu variant="compact">
        <MenuButton
          as={IconButton}
          aria-label={fullSourceItems.length > 0 ? 'Full text sources' : 'No full text sources'}
          icon={<DocumentTextIcon className="default-icon" />}
          isDisabled={fullSourceItems.length === 0}
          variant="link"
          size="xs"
        ></MenuButton>
        {fullSourceItems.length > 0 && (
          <MenuList>
            {fullSourceItems.map((item) => (
              <MenuItem key={item.id} data-id={item.id} onClick={handleResourceClick}>
                {item.label}
              </MenuItem>
            ))}
          </MenuList>
        )}
      </Menu>

      {/* reference and citation items menu */}
      <Menu variant="compact">
        <MenuButton
          as={IconButton}
          aria-label={referenceItems.length > 0 ? 'References and citations' : 'No references and citations'}
          icon={<ViewListIcon className="default-icon" />}
          isDisabled={referenceItems.length === 0}
          variant="link"
          size="xs"
        ></MenuButton>
        {referenceItems.length > 0 && (
          <MenuList>
            {referenceItems.map((item) => (
              <MenuItem key={item.id} data-id={item.id} onClick={handleReferenceClick}>
                {item.label}
              </MenuItem>
            ))}
          </MenuList>
        )}
      </Menu>

      {/* data product items menu */}
      <Menu variant="compact">
        <MenuButton
          as={IconButton}
          aria-label={dataProductItems.length > 0 ? 'Data products' : 'No data products'}
          icon={<DatabaseIcon className="default-icon" />}
          isDisabled={dataProductItems.length === 0}
          variant="link"
          size="xs"
        ></MenuButton>
        {dataProductItems.length > 0 && (
          <MenuList>
            {dataProductItems.map((item) => (
              <MenuItem key={item.id} data-id={item.id} onClick={handleDataProductClick}>
                {item.label}
              </MenuItem>
            ))}
          </MenuList>
        )}
      </Menu>
    </>
  );
};
