import { IDocsEntity } from '@api';
import { Button } from '@chakra-ui/button';
import { ChevronDownIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { HStack, Text } from '@chakra-ui/layout';
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import { ItemType } from '@components/Dropdown/types';
import { isBrowser } from '@utils';
import { isNil } from 'ramda';
import { HTMLAttributes, MouseEvent, MouseEventHandler, ReactElement, useMemo } from 'react';
import { IDataProductSource, IFullTextSource, IRelatedWorks, processLinkData } from './linkGenerator';

export interface IAbstractSourcesProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSources = ({ doc }: IAbstractSourcesProps): ReactElement => {
  const sources = useMemo(() => {
    if (doc && Array.isArray(doc.esources)) {
      return processLinkData(doc, null);
    }
  }, [doc]);

  if (!doc) {
    return <></>;
  }

  const { esources } = doc;
  if (isNil(esources)) {
    return <Text>No Sources</Text>;
  }

  return (
    <HStack as="section" wrap="wrap" spacing={0.5} columnGap={1} rowGap={1}>
      <FullTextDropdown sources={sources.fullTextSources} />
      <DataProductDropdown dataProducts={sources.dataProducts} relatedWorks={[]} />
      {isBrowser() ? <Button>Add to library</Button> : null}
    </HStack>
  );
};

///// dropdown components //////

interface IFullTextDropdownProps {
  sources: IFullTextSource[];
}

const FullTextDropdown = (props: IFullTextDropdownProps): ReactElement => {
  const { sources } = props;

  const fullSourceItems = sources.map((source) => ({
    id: source.name,
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
    domId: `fullText-${source.name}`,
  }));

  const label = (
    <Button rightIcon={<ChevronDownIcon />} isDisabled={fullSourceItems.length === 0}>
      Full Text Sources
    </Button>
  );

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    const path = fullSourceItems.find((item) => id === item.id)?.path;
    if (isBrowser() && path) {
      window.open(path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {!isBrowser() ? (
        <span>
          {fullSourceItems.length === 0 ? (
            label
          ) : (
            <SimpleLinkDropdown items={fullSourceItems} label={label} minWidth="170px" />
          )}
        </span>
      ) : null}
      {isBrowser() ? (
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

<<<<<<< HEAD
  const dataProductItems = useMemo(
    () =>
      dataProducts.map((source) => ({
        id: source.name,
        label: source.name,
        path: source.url,
        domId: `dataProd-${source.name}`,
        classes: 'pl-6',
      })),
    [dataProducts],
  );

  const relatedWorkItems = useMemo(
    () =>
      relatedWorks.map((source) => ({
        id: source.name,
        label: source.name,
        path: source.url,
        domId: `relatedWorks-${source.name}`,
        classes: 'pl-6',
      })),
    [],
  );
=======
  const dataProductItems = dataProducts.map((source) => ({
    id: source.name,
    label: source.name,
    path: source.url,
  }));

  const relatedWorkItems = relatedWorks.map((source) => ({
    id: source.name,
    label: source.name,
    path: source.url,
  }));
>>>>>>> JS Independency fix - custom dropdown

  const items: ItemType[] = [];

  if (dataProductItems.length > 0) {
    // data product heading
    items.push({
      id: 'data-subheading',
      label: 'Data Products',
      path: '',
      disabled: true,
    });
    items.push(...dataProductItems);
  }

  if (relatedWorkItems.length > 0) {
    // related works heading
    items.push({
      id: 'related-subheading',
      label: 'Related Materials',
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
    if (isBrowser() && path) {
      window.open(path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {!isBrowser() ? (
        <span>{items.length === 0 ? label : <SimpleLinkDropdown items={items} label={label} minWidth="150px" />}</span>
      ) : null}
      {isBrowser() ? (
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={items.length === 0}>
            Other Resources
          </MenuButton>
          {items.length > 0 && (
            <MenuList>
              {items.map((item) => (
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
