import { IDocsEntity } from '@api';
import { SimpleLinkDropdown } from '@components/Dropdown/SimpleLinkDropdown';
import { ItemType } from '@components/Dropdown/types';
import { isBrowser } from '@utils';
import { isNil } from 'ramda';
import { HTMLAttributes, ReactElement, MouseEvent } from 'react';
import { IDataProductSource, IFullTextSource, IRelatedWorks, processLinkData } from './linkGenerator';
import { Button } from '@chakra-ui/button';
import { Text, HStack } from '@chakra-ui/layout';
import { Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/menu';
import { LockIcon, UnlockIcon, ChevronDownIcon } from '@chakra-ui/icons';

export interface IAbstractSourcesProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSources = ({ doc }: IAbstractSourcesProps): ReactElement => {
  if (!doc) {
    return <></>;
  }

  const { esources } = doc;
  if (isNil(esources)) {
    return <Text>No Sources</Text>;
  }
  const sources = processLinkData(doc, null);

  return (
    <HStack as="section" wrap="wrap" spacing={0} columnGap={2} rowGap={2}>
      <FullTextDropdown sources={sources.fullTextSources} />
      <DataProductDropdown dataProducts={sources.dataProducts} relatedWorks={[]} />
      {isBrowser() ? <Button>Add to library</Button> : null}
    </HStack>
  );
};

///// dropdown components //////

const dropdownButtonClasses = 'button-sm pl-2 pr-1 cursor-pointer';

const dropdownButtonClassesInactive = 'button-sm-disabled pl-2 pr-1 cursor-default';

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
          <SimpleLinkDropdown
            items={fullSourceItems}
            label={label}
            selected={''}
            aria-label="Full Text Sources"
            classes={{
              label: fullSourceItems.length > 0 ? dropdownButtonClasses : dropdownButtonClassesInactive,
              list: 'w-60 h-auto',
              item: 'p-2 flex justify-start',
            }}
            role={{ label: 'list', item: 'listitem' }}
          />
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

  const dataProductItems = dataProducts.map((source) => ({
    id: source.name,
    label: source.name,
    path: source.url,
    domId: `dataProd-${source.name}`,
    classes: 'pl-6',
  }));

  const relatedWorkItems = relatedWorks.map((source) => ({
    id: source.name,
    label: source.name,
    path: source.url,
    domId: `relatedWorks-${source.name}`,
    classes: 'pl-6',
  }));

  const items: ItemType[] = [];

  if (dataProductItems.length > 0) {
    // data product heading
    items.push({
      id: 'data-subheading',
      label: 'Data Products',
      domId: 'dataProducts',
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
      domId: 'relatedWorks',
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

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    const path = items.find((item) => id === item.id)?.path;
    if (isBrowser() && path) {
      window.open(path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {!isBrowser() ? (
        <span>
          {items.length > 0 ? (
            <SimpleLinkDropdown
              items={items}
              label={label}
              selected={''}
              aria-label="Other Resources"
              classes={{
                list: 'w-60 h-auto',
                item: 'p-2',
              }}
              role={{ label: 'list', item: 'listitem' }}
            />
          ) : null}
        </span>
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
