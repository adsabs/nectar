import { Esources, IDocsEntity, useGetUserSettings } from '@api';
import {
  Button,
  HStack,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ChevronDownIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { SimpleLinkList } from '@components';
import { ItemType } from '@components/Dropdown/types';
import { useIsClient } from '@lib/useIsClient';
import { HTMLAttributes, MouseEvent, MouseEventHandler, ReactElement, useMemo } from 'react';
import { useResolverQuery } from '@api/resolver';
import { AcademicCapIcon } from '@heroicons/react/24/solid';
import { processLinkData } from '@components/AbstractSources/linkGenerator';
import { IDataProductSource, IFullTextSource, IRelatedWorks } from '@components/AbstractSources/types';

export interface IAbstractSourcesProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSources = ({ doc }: IAbstractSourcesProps): ReactElement => {
  const isClient = useIsClient();
  const { data: settings } = useGetUserSettings();
  const sources = processLinkData(doc, settings?.link_server);

  const { data: relatedWorksResp } = useResolverQuery(
    { bibcode: doc.bibcode, link_type: 'associated' },
    { enabled: !!doc?.bibcode },
  );

  const relatedWorks = useMemo(() => {
    const res = [] as IRelatedWorks[];
    if (relatedWorksResp && !relatedWorksResp.error && relatedWorksResp.links.count > 0) {
      for (const link of relatedWorksResp.links.records) {
        res.push({ url: link.url, name: link.title, description: link.type });
      }
    }
    return res;
  }, [relatedWorksResp]);

  if (!doc) {
    return <></>;
  }

  return (
    <>
      {!isClient ? (
        <VStack as="section" wrap="wrap" spacing={0.5} columnGap={1} rowGap={1} alignItems="start">
          <FullTextDropdown sources={sources.fullTextSources} />
          <DataProductDropdown dataProducts={sources.dataProducts} relatedWorks={[]} />
        </VStack>
      ) : (
        <HStack as="section" wrap="wrap" spacing={0.5} columnGap={1} rowGap={1} alignItems="start">
          <FullTextDropdown sources={sources.fullTextSources} />
          <DataProductDropdown dataProducts={sources.dataProducts} relatedWorks={relatedWorks} />
          <Button hidden={true}>Add to library</Button>
        </HStack>
      )}
    </>
  );
};

///// dropdown components //////

interface IFullTextDropdownProps {
  sources: IFullTextSource[];
}

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
      <LockIcon color="gray.700" mr={1} />
      {` ${source.name}`}
    </>
  );
};

const FullTextDropdown = (props: IFullTextDropdownProps): ReactElement => {
  const { sources } = props;
  const isClient = useIsClient();

  const fullSourceItems = sources.map((source) => ({
    id: source.name,
    label: getLabel(source),
    path: source.url,
    newTab: true,
  }));

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    const path = fullSourceItems.find((item) => id === item.id)?.path;
    if (isClient && path) {
      window.open(path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {!isClient && (
        <span>
          <SimpleLinkList items={fullSourceItems} minWidth="180px" label="Full text sources" showLabel={true} asRow />
        </span>
      )}
      {isClient ? (
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
  const isClient = useIsClient();

  const dataProductItems = useMemo(
    () =>
      dataProducts.map((source) => ({
        id: source.name,
        label: `${source.name} (${source.count})`,
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

  const handleSelect: MouseEventHandler<HTMLElement> = (e) => {
    const id = e.currentTarget.dataset['id'];
    const path = items.find((item) => id === item.id)?.path as string;
    if (isClient && path) {
      window.open(path, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {!isClient ? (
        <span>
          <SimpleLinkList items={items} minWidth="150px" label="Other Resources" showLabel={true} asRow />
        </span>
      ) : null}
      {isClient && (
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            isDisabled={dataProducts.length === 0 && relatedWorks.length === 0}
          >
            Other Resources
          </MenuButton>
          <MenuList>
            {dataProductItems.length > 0 && (
              <MenuGroup title="Data Products">
                {dataProductItems.map((item) => (
                  <MenuItem key={item.id} data-id={item.id} onClick={handleSelect}>
                    <Text ml={2}>{item.label}</Text>
                  </MenuItem>
                ))}
              </MenuGroup>
            )}
            {relatedWorkItems.length > 0 && (
              <>
                {dataProductItems.length > 0 && <MenuDivider />}
                <MenuGroup title="Related Materials">
                  {relatedWorkItems.map((item) => (
                    <MenuItem key={item.id} data-id={item.id} onClick={handleSelect}>
                      <Text ml={2}>{item.label}</Text>
                    </MenuItem>
                  ))}
                </MenuGroup>
              </>
            )}
          </MenuList>
        </Menu>
      )}
    </>
  );
};
