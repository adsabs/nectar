import { IconButton, Menu, MenuButton, MenuItem, MenuList, useClipboard, useToast } from '@chakra-ui/react';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { processLinkData } from '@/components/AbstractSources/linkGenerator';
import { SimpleAction } from '@/components/Orcid/SimpleAction';
import { Bars4Icon, CircleStackIcon, DocumentTextIcon, ShareIcon } from '@heroicons/react/24/outline';
import { useIsClient } from '@/lib/useIsClient';
import { useRouter } from 'next/router';
import { MouseEventHandler, ReactElement, useEffect } from 'react';
import { SimpleLinkDropdown } from '@/components/Dropdown';
import { isBrowser } from '@/utils/common/guards';
import { IDocsEntity } from '@/api/search/types';
import CopyToClipboard from 'react-copy-html-to-clipboard';

export interface IItemResourceDropdownsProps {
  doc: IDocsEntity;
  defaultCitation: string;
}

export interface IItem {
  id: string;
  label: ReactElement | string;
  path?: string;
}

export const ItemResourceDropdowns = ({ doc, defaultCitation }: IItemResourceDropdownsProps): ReactElement => {
  const router = useRouter();
  const isClient = useIsClient();
  const toast = useToast({ duration: 2000 });

  const { hasCopied, onCopy, setValue, value } = useClipboard('');

  useEffect(() => {
    if (value !== '') {
      onCopy();
    }
  }, [value]);

  useEffect(() => {
    if (hasCopied) {
      toast({ status: 'info', title: 'Copied to Clipboard' });
      setValue('');
    }
  }, [hasCopied]);

  let fullSourceItems: IItem[] = [];

  let dataProductItems: IItem[] = [];

  // full text resources and data products
  const sources = processLinkData(doc, null);
  if (sources) {
    const fullTextSources = sources.fullTextSources;
    const dataProducts = sources.dataProducts;

    fullSourceItems = fullTextSources.map((source) => ({
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
      label: dp.name,
      path: dp.url,
      id: `dataProd-${dp.name}`,
      newTab: true,
    }));
  }

  // citations and references
  const num_references = typeof doc['[citations]']?.num_references === 'number' ? doc['[citations]'].num_references : 0;
  const num_citations = typeof doc['[citations]']?.num_citations === 'number' ? doc['[citations]'].num_citations : 0;

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

  const handleResourceClick: MouseEventHandler<HTMLElement> = (e) => {
    const id = e.currentTarget.dataset['id'];
    const path = fullSourceItems.find((item) => id === item.id)?.path;
    if (isBrowser() && path) {
      window.open(path, '_blank', 'noopener,noreferrer');
    }
  };

  const handleReferenceClick: MouseEventHandler<HTMLElement> = (e) => {
    const id = e.currentTarget.dataset['id'];
    const path = referenceItems.find((item) => id === item.id)?.path;
    if (isBrowser() && path) {
      void router.push(path);
    }
  };

  const handleDataProductClick: MouseEventHandler<HTMLElement> = (e) => {
    const id = e.currentTarget.dataset['id'];
    const path = dataProductItems.find((item) => id === item.id)?.path;
    if (isBrowser() && path) {
      window.open(path, '_blank', 'noopener,noreferrer');
    }
  };

  const simpleFullSourceItemsLabel = (
    <IconButton
      aria-label={fullSourceItems.length > 0 ? 'Full text sources' : 'No full text sources'}
      icon={<DocumentTextIcon />}
      isDisabled={fullSourceItems.length === 0}
      variant="link"
      size="xs"
    />
  );

  const simpleRefItemsLabel = (
    <IconButton
      aria-label={referenceItems.length > 0 ? 'References and citations' : 'No references and citations'}
      icon={<Bars4Icon />}
      isDisabled={referenceItems.length === 0}
      variant="link"
      size="xs"
    />
  );

  const simpleDataItemsLabel = (
    <IconButton
      aria-label={dataProductItems.length > 0 ? 'Data products' : 'No data products'}
      icon={<CircleStackIcon />}
      isDisabled={dataProductItems.length === 0}
      variant="link"
      size="xs"
    />
  );

  const handleCopyAbstractUrl = () => {
    setValue(`${process.env.NEXT_PUBLIC_BASE_CANONICAL_URL}/abs/${doc.bibcode}/abstract`);
  };

  const handleCitationCopied = () => {
    if (defaultCitation !== '') {
      toast({ status: 'info', title: 'Copied to Clipboard' });
    } else {
      toast({ status: 'error', title: 'There was a problem fetching citation. Try reloading the page.' });
    }
  };

  return (
    <>
      {/* orcid menu */}
      <SimpleAction doc={doc} />
      {/* full resources menu */}
      {isClient ? (
        <Menu variant="compact">
          <MenuButton
            as={IconButton}
            aria-label={fullSourceItems.length > 0 ? 'Full text sources' : 'No full text sources'}
            icon={<DocumentTextIcon width="18px" height="18px" />}
            isDisabled={fullSourceItems.length === 0}
            variant="link"
            size="xs"
          />
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
      ) : (
        <>
          {fullSourceItems.length === 0 ? (
            simpleFullSourceItemsLabel
          ) : (
            <SimpleLinkDropdown
              items={fullSourceItems}
              label={simpleFullSourceItemsLabel}
              minListWidth="180px"
              alignRight={true}
            />
          )}
        </>
      )}
      {/* reference and citation items menu */}
      {isClient ? (
        <Menu variant="compact">
          <MenuButton
            as={IconButton}
            aria-label={referenceItems.length > 0 ? 'References and citations' : 'No references and citations'}
            icon={<Bars4Icon width="18px" height="18px" />}
            isDisabled={referenceItems.length === 0}
            variant="link"
            size="xs"
          />
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
      ) : (
        <>
          {referenceItems.length === 0 ? (
            simpleRefItemsLabel
          ) : (
            <SimpleLinkDropdown
              items={referenceItems}
              label={simpleRefItemsLabel}
              minListWidth="150px"
              alignRight={true}
            />
          )}
        </>
      )}
      {/* data product items menu */}
      {isClient ? (
        <Menu variant="compact">
          <MenuButton
            as={IconButton}
            aria-label={dataProductItems.length > 0 ? 'Data products' : 'No data products'}
            icon={<CircleStackIcon width="18px" height="18px" />}
            isDisabled={dataProductItems.length === 0}
            variant="link"
            size="xs"
          />
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
      ) : (
        <>
          {dataProductItems.length === 0 ? (
            simpleDataItemsLabel
          ) : (
            <SimpleLinkDropdown
              items={dataProductItems}
              label={simpleDataItemsLabel}
              minListWidth="120px"
              alignRight={true}
            />
          )}
        </>
      )}
      {/* share menu */}
      <Menu variant="compact">
        <MenuButton
          as={IconButton}
          aria-label="share options"
          icon={<ShareIcon width="18px" height="18px" />}
          variant="link"
          size="xs"
        />
        <MenuList>
          <MenuItem onClick={handleCopyAbstractUrl}>Copy URL</MenuItem>

          <CopyToClipboard text={defaultCitation} onCopy={handleCitationCopied} options={{ asHtml: true }}>
            <MenuItem>Copy Citation</MenuItem>
          </CopyToClipboard>
        </MenuList>
      </Menu>
    </>
  );
};
