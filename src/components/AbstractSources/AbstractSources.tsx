import { Esources, IDocsEntity } from '@api';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { ChevronDownIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { SimpleLink } from '@components';
import { ReactElement, useMemo } from 'react';
import { useResolverQuery } from '@api/resolver';
import { AcademicCapIcon } from '@heroicons/react/24/solid';
import { processLinkData } from '@components/AbstractSources/linkGenerator';
import { IFullTextSource } from '@components/AbstractSources/types';
import { useSettings } from '@lib/useSettings';
import { AbstractSourceItems, AbstractResourceType } from './AbstractSourceItems';

export interface IAbstractSourcesProps {
  doc?: IDocsEntity;
  style: 'accordion' | 'menu';
}

export const AbstractSources = ({ doc, style }: IAbstractSourcesProps): ReactElement => {
  const { settings } = useSettings();

  const sources = processLinkData(doc, settings.link_server);

  const fullTextResources: AbstractResourceType[] = useMemo(() => {
    return !sources || !sources.fullTextSources
      ? ([] as AbstractResourceType[])
      : sources.fullTextSources.map((s) => ({
          id: s.name,
          label: getLabel(s),
          path: s.url,
        }));
  }, [sources]);

  const dataProductResources: AbstractResourceType[] = useMemo(() => {
    return !sources || !sources.dataProducts
      ? ([] as AbstractResourceType[])
      : sources.dataProducts.map((s) => ({
          id: s.name,
          label: `${s.name} (${s.count})`,
          path: s.url,
        }));
  }, [sources]);

  const { data: relatedWorksResp } = useResolverQuery(
    { bibcode: doc.bibcode, link_type: 'associated' },
    { enabled: !!doc?.bibcode },
  );

  const relatedResources: AbstractResourceType[] = useMemo(
    () =>
      !relatedWorksResp || relatedWorksResp.error || relatedWorksResp.links.count === 0
        ? ([] as AbstractResourceType[])
        : relatedWorksResp.links.records.map((s) => ({
            id: s.title,
            label: s.title,
            path: s.url,
          })),
    [relatedWorksResp],
  );

  if (!doc) {
    return <></>;
  }

  return (
    <>
      {style === 'accordion' ? (
        <Box>
          <Accordion variant="abs-resources" allowMultiple defaultIndex={fullTextResources.length === 0 ? [] : [0]}>
            <AccordionItem isDisabled={fullTextResources.length === 0}>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Full Text Sources
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                <AbstractSourceItems resources={fullTextResources} type="list" />
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem isDisabled={dataProductResources.length === 0}>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Data Products
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                <AbstractSourceItems resources={dataProductResources} type="list" />
              </AccordionPanel>
            </AccordionItem>
            <AccordionItem isDisabled={relatedResources.length === 0}>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  Related Materials
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                <AbstractSourceItems resources={relatedResources} type="list" />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Box>
      ) : (
        <Box>
          <HStack as="section" wrap="wrap" spacing={0.5} columnGap={1} rowGap={1} alignItems="start">
            <AbstractSourceItems resources={fullTextResources} type="menu" />
            <DataProductDropdown dataProducts={dataProductResources} relatedWorks={relatedResources} />
          </HStack>
        </Box>
      )}
    </>
  );
};

const getLabel = (source: IFullTextSource) => {
  if (source.type === Esources.INSTITUTION) {
    return (
      <>
        <Icon as={AcademicCapIcon} mr={1} />
        {` ${source.name}`}
      </>
    );
  } else if (source.open) {
    return (
      <>
        <UnlockIcon color="green.600" mr={1} />
        {` ${source.name}`}
      </>
    );
  }
  return (
    <>
      <LockIcon mr={1} />
      {` ${source.name}`}
    </>
  );
};

interface IRelatedMaterialsDropdownProps {
  dataProducts: AbstractResourceType[];
  relatedWorks: AbstractResourceType[];
}

const DataProductDropdown = (props: IRelatedMaterialsDropdownProps): ReactElement => {
  const { dataProducts, relatedWorks } = props;

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        isDisabled={dataProducts.length === 0 && relatedWorks.length === 0}
      >
        Other Resources
      </MenuButton>
      <MenuList>
        {dataProducts.length > 0 && (
          <MenuGroup title="Data Products">
            {dataProducts.map((item) => (
              <MenuItem key={item.id} data-id={item.id} as={SimpleLink} href={item.path} newTab>
                {item.label}
              </MenuItem>
            ))}
          </MenuGroup>
        )}
        {relatedWorks.length > 0 && (
          <>
            {dataProducts.length > 0 && <MenuDivider />}
            <MenuGroup title="Related Materials">
              {relatedWorks.map((item) => (
                <MenuItem key={item.id} data-id={item.id} as={SimpleLink} href={item.path} newTab>
                  {item.label}
                </MenuItem>
              ))}
            </MenuGroup>
          </>
        )}
      </MenuList>
    </Menu>
  );
};
