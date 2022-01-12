import { IDocsEntity } from '@api';
import { Button } from '@chakra-ui/button';
import { ChevronDownIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { HStack, Text, VStack } from '@chakra-ui/layout';
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { SimpleLinkList } from '@components';
import { ItemType } from '@components/Dropdown/types';
import { isNil } from 'ramda';
import { HTMLAttributes, MouseEvent, MouseEventHandler, ReactElement, useEffect, useMemo, useState } from 'react';
import { IDataProductSource, IFullTextSource, IRelatedWorks, processLinkData } from './linkGenerator';

export interface IAbstractSourcesProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSources = ({ doc }: IAbstractSourcesProps): ReactElement => {
  const [isMounted, setIsMounted] = useState(false);
  const sources = useMemo(() => {
    if (doc && Array.isArray(doc.esources)) {
      return processLinkData(doc, null);
    }
  }, [doc]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!doc) {
    return <></>;
  }

  const { esources } = doc;
  if (isNil(esources)) {
    return <Text>No Sources</Text>;
  }

  return (
    <>
      {!isMounted ? (
        <VStack as="section" wrap="wrap" spacing={0.5} columnGap={1} rowGap={1} alignItems="start">
          <FullTextDropdown sources={sources.fullTextSources} />
          <DataProductDropdown dataProducts={sources.dataProducts} relatedWorks={[]} />
        </VStack>
      ) : (
        <HStack as="section" wrap="wrap" spacing={0.5} columnGap={1} rowGap={1} alignItems="start">
          <FullTextDropdown sources={sources.fullTextSources} />
          <DataProductDropdown dataProducts={sources.dataProducts} relatedWorks={[]} />
          <Button>Add to library</Button>
        </HStack>
      )}
    </>
  );
};

///// dropdown components //////

interface IFullTextDropdownProps {
  sources: IFullTextSource[];
}

const FullTextDropdown = (props: IFullTextDropdownProps): ReactElement => {
  const { sources } = props;

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fullSourceItems = sources.map((source) => ({
    id: source.name,
    label: source.open ? (
      <>
        <UnlockIcon color="green.600" mr={1} />
        {` ${source.name}`}
      </>
    ) : (
      <>
        <LockIcon color="gray.700" mr={1} />
        {` ${source.name}`}
      </>
    ),
    path: source.url,
    newTab: true,
  }));

  const label = (
    <Button rightIcon={<ChevronDownIcon />} isDisabled={fullSourceItems.length === 0}>
      Full Text Sources
    </Button>
  );

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    const path = fullSourceItems.find((item) => id === item.id)?.path;
    if (isMounted && path) {
      window.open(path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {!isMounted ? (
        <span>
          {/* {fullSourceItems.length === 0 ? (
            label
          ) : (
            <SimpleLinkDropdown items={fullSourceItems} label={label} minListWidth="180px" />
          )} */}
          <SimpleLinkList items={fullSourceItems} minWidth="180px" label="Full text sources" showLabel={true} asRow />
        </span>
      ) : null}
      {isMounted ? (
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={fullSourceItems.length === 0}>
            Full Text Sources
          </MenuButton>
          {fullSourceItems.length > 0 && (
            <MenuList>
              {fullSourceItems.map((item) => (
                <MenuItem key={item.id} data-id={item.id} onClick={handleSelect}>
                  {item.label}
                </MenuItem>
              ))}
            </MenuList>
          )}
        </Menu>
      ) : null}
    </>
  );
};

interface IRelatedMaterialsDropdownProps {
  dataProducts: IDataProductSource[];
  relatedWorks: IRelatedWorks[];
}

const DataProductDropdown = (props: IRelatedMaterialsDropdownProps): ReactElement => {
  const { dataProducts, relatedWorks } = props;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const dataProductItems = useMemo(
    () =>
      dataProducts.map((source) => ({
        id: source.name,
        label: source.name,
        path: source.url,
        newTab: true,
      })),
    [dataProducts],
  );

  const relatedWorkItems = useMemo(
    () =>
      relatedWorks.map((source) => ({
        id: source.name,
        label: source.name,
        path: source.url,
        newTab: true,
      })),
    [relatedWorks],
  );

  const items: ItemType[] = [];

  if (dataProductItems.length > 0) {
    // data product heading
    items.push({
      id: 'data-subheading',
      label: 'Data Products:',
      path: '',
      disabled: true,
    });
    items.push(...dataProductItems);
  }

  if (relatedWorkItems.length > 0) {
    // related works heading
    items.push({
      id: 'related-subheading',
      label: 'Related Materials:',
      path: '',
      disabled: true,
    });
    items.push(...relatedWorkItems);
  }

  const label = (
    <Button rightIcon={<ChevronDownIcon />} isDisabled={items.length === 0}>
      Other Resources
    </Button>
  );

  const handleSelect: MouseEventHandler<HTMLElement> = (e) => {
    const id = e.currentTarget.dataset['id'];
    const path = items.find((item) => id === item.id)?.path;
    if (isMounted && path) {
      window.open(path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {!isMounted ? (
        <span>
          {/* {items.length === 0 ? label : <SimpleLinkDropdown items={items} label={label} minListWidth="150px" />} */}
          <SimpleLinkList items={items} minWidth="150px" label="Other Resources" showLabel={true} asRow />
        </span>
      ) : null}
      {isMounted ? (
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={items.length === 0}>
            Other Resources
          </MenuButton>
          {items.length > 0 && (
            <MenuList>
              {items.map((item) => (
                <MenuItem key={item.id} data-id={item.id} onClick={handleSelect} isDisabled={item.disabled}>
                  {item.label}
                </MenuItem>
              ))}
            </MenuList>
          )}
        </Menu>
      ) : null}
    </>
  );
};
