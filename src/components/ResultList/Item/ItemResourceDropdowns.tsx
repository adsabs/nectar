import {
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tooltip,
  useClipboard,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { processLinkData } from '@/components/AbstractSources/linkGenerator';
import { SimpleAction } from '@/components/Orcid/SimpleAction';
import { Bars4Icon, CircleStackIcon, DocumentTextIcon, ShareIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { MouseEventHandler, ReactElement, useEffect } from 'react';
import { isBrowser } from '@/utils/common/guards';
import { IDocsEntity } from '@/api/search/types';
import { CopyMenuItem } from '@/components/CopyButton';
import { useGetExportCitation } from '@/api/export/export';
import { useSettings } from '@/lib/useSettings';

export interface IItemResourceDropdownsProps {
  doc: IDocsEntity;
  /** @deprecated No longer used — citation is fetched lazily. */
  defaultCitation?: string;
}

export interface IItem {
  id: string;
  label: ReactElement | string;
  path?: string;
}

export const ItemResourceDropdowns = ({ doc }: IItemResourceDropdownsProps): ReactElement => {
  const router = useRouter();
  const toast = useToast();
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { settings } = useSettings();

  const { data: citationData } = useGetExportCitation(
    {
      format: settings.defaultCitationFormat,
      bibcode: [doc.bibcode],
    },
    { enabled: isShareOpen && !!doc.bibcode },
  );

  const citation = citationData?.export ?? '';

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

  const encodedCanonicalID = doc?.bibcode ? encodeURIComponent(doc.bibcode) : '';

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
  const num_references = typeof doc.reference_count === 'number' ? doc.reference_count : 0;
  const num_citations = typeof doc.citation_count === 'number' ? doc.citation_count : 0;

  const referenceItems: IItem[] = [];
  if (num_citations > 0) {
    referenceItems.push({
      id: `ref-dropdown-cit-${doc.bibcode}`,
      label: `Citations (${num_citations})`,
      path: `/abs/${encodedCanonicalID}/citations`,
    });
  }

  if (num_references > 0) {
    referenceItems.push({
      id: `ref-dropdown-ref-${doc.bibcode}`,
      label: `References (${num_references})`,
      path: `/abs/${encodedCanonicalID}/references`,
    });
  }

  const handleResourceClick: MouseEventHandler<HTMLElement> = (e) => {
    const id = e.currentTarget.dataset['id'];
    const path = fullSourceItems.find((item) => id === item.id)?.path;
    if (isBrowser() && path) {
      window.open(path, '_blank', 'noopener');
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
      window.open(path, '_blank', 'noopener');
    }
  };

  const handleCopyAbstractUrl = () => {
    setValue(`${process.env.NEXT_PUBLIC_BASE_CANONICAL_URL}/abs/${encodedCanonicalID}/abstract`);
  };

  const handleCitationCopied = () => {
    if (!!citation) {
      toast({ status: 'info', title: 'Copied to Clipboard' });
    } else {
      toast({ status: 'error', title: 'There was a problem fetching citation. Try reloading the page.' });
    }
  };

  return (
    <Flex direction="row" id="tour-quick-icons">
      {/* orcid menu */}
      <SimpleAction doc={doc} />
      {/* full resources menu */}
      <Tooltip label="Full text sources" shouldWrapChildren>
        <Menu variant="compact">
          <MenuButton
            as={IconButton}
            aria-label={fullSourceItems.length > 0 ? 'Full text sources' : 'No full text sources'}
            icon={<DocumentTextIcon width="20px" height="20px" />}
            isDisabled={fullSourceItems.length === 0}
            variant="link"
            size="sm"
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
      </Tooltip>

      {/* reference and citation items menu */}
      <Tooltip label="References and citations" shouldWrapChildren>
        <Menu variant="compact">
          <MenuButton
            as={IconButton}
            aria-label={referenceItems.length > 0 ? 'References and citations' : 'No references and citations'}
            icon={<Bars4Icon width="20px" height="20" />}
            isDisabled={referenceItems.length === 0}
            variant="link"
            size="sm"
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
      </Tooltip>

      {/* data product items menu */}
      <Tooltip label="Data products" shouldWrapChildren>
        <Menu variant="compact">
          <MenuButton
            as={IconButton}
            aria-label={dataProductItems.length > 0 ? 'Data products' : 'No data products'}
            icon={<CircleStackIcon width="20px" height="20px" />}
            isDisabled={dataProductItems.length === 0}
            variant="link"
            size="sm"
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
      </Tooltip>
      {/* share menu */}
      <Tooltip label="Share options" shouldWrapChildren>
        <Menu variant="compact" isOpen={isShareOpen} onOpen={onShareOpen} onClose={onShareClose}>
          <MenuButton
            as={IconButton}
            aria-label="share options"
            icon={<ShareIcon width="20px" height="20px" />}
            variant="link"
            size="sm"
          />
          <MenuList>
            <MenuItem onClick={handleCopyAbstractUrl}>Copy URL</MenuItem>
            <CopyMenuItem text={citation} onCopyComplete={handleCitationCopied} label="Copy Citation" asHtml />
          </MenuList>
        </Menu>
      </Tooltip>
    </Flex>
  );
};
