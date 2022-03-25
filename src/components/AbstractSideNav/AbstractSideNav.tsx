import { IDocsEntity } from '@api';
import { Button } from '@chakra-ui/button';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Badge, Box, Flex, Link, Stack, Text } from '@chakra-ui/layout';
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { SimpleLinkList } from '@components';
import { ItemType } from '@components/Dropdown/types';
import { DocumentIcon } from '@heroicons/react/outline';
import { useIsClient } from '@hooks/useIsClient';
import { useBaseRouterPath } from '@utils';
import { useHasGraphics } from '@_api/graphics';
import { useHasMetrics } from '@_api/metrics';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import qs from 'qs';
import { last } from 'ramda';
import { HTMLAttributes, ReactElement } from 'react';
import { navigation, Routes } from './model';

export interface IAbstractSideNavProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSideNav = ({ doc }: IAbstractSideNavProps): ReactElement => {
  const router = useRouter();
  const { basePath } = useBaseRouterPath();
  const subPage = last(basePath.split('/'));
  const hasGraphics = useHasGraphics(doc.bibcode);
  const hasMetrics = useHasMetrics(doc.bibcode);
  const hasToc = doc.property ? doc.property.indexOf('TOC') > -1 : false;
  const useCount = [Routes.CITATIONS, Routes.REFERENCES];
  const isClient = useIsClient();

  const items = navigation.map((item) => {
    const MenuIcon = item.icon || DocumentIcon;
    const current = item.href === subPage;
    const count =
      item.href === Routes.EXPORT ||
      (item.href === Routes.GRAPHICS && hasGraphics) ||
      (item.href === Routes.METRICS && hasMetrics) ||
      (item.href === Routes.VOLUMECONTENT && hasToc)
        ? 1
        : getCount(item.href, doc);
    const disabled = count === 0 && item.href !== Routes.ABSTRACT;
    const showCount = count > 0 && useCount.includes(item.href);
    const href = { pathname: disabled ? Routes.ABSTRACT : item.href, query: { id: router.query.id } };

    const label = (
      <Stack direction="row" alignItems="center">
        <MenuIcon className="mr-3 w-6 h-6" aria-hidden="true" />
        <Text fontWeight="normal">{item.name}</Text>
        {showCount ? (
          <Badge
            mx={3}
            py={1}
            fontSize="xs"
            fontWeight="normal"
            borderRadius="xl"
            colorScheme="gray"
            px={2}
            backgroundColor="gray.50"
          >
            {count}
          </Badge>
        ) : null}
      </Stack>
    );

    return {
      id: item.name,
      name: item.name,
      disabled,
      current,
      label,
      href,
      count,
      icon: MenuIcon,
      showCount,
    };
  });

  const getTopMenu = () => {
    const currentItem = items.find((item) => item.current) ?? items[0];

    const { icon: MenuIcon, showCount, count } = currentItem;

    const label = (
      <Flex
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="gray.50"
        borderRadius="md"
        px={3}
        py={2}
        width="full"
      >
        <Flex direction="row" width="full">
          <MenuIcon className="mr-3 w-6 h-6" aria-hidden="true" />
          <Text>{currentItem.name}</Text>
          {showCount ? (
            <Badge
              mx={3}
              py={1}
              fontSize="xs"
              fontWeight="normal"
              borderRadius="xl"
              colorScheme="gray"
              px={2}
              backgroundColor="white"
            >
              {count}
            </Badge>
          ) : null}
        </Flex>
        <ChevronDownIcon />
      </Flex>
    );

    const getSimpleItems = (): ItemType[] => {
      const res = items.map((item) => ({
        id: item.id,
        label: item.label,
        path: `${item.href.pathname}?${qs.stringify(item.href.query)}`,
        disabled: item.disabled,
      }));
      return res;
    };

    return (
      <>
        {isClient ? (
          <Menu matchWidth>
            <MenuButton width="full">{label}</MenuButton>
            <MenuList>
              {items.map((item) => (
                <MenuItem
                  key={item.id}
                  isDisabled={item.disabled}
                  backgroundColor={item.current ? 'gray.100' : 'transparent'}
                  mb={1}
                >
                  <NextLink key={item.name} href={item.href} passHref>
                    <Box width="full">{item.label}</Box>
                  </NextLink>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        ) : (
          <>
            {/* <SimpleLinkDropdown items={getSimpleItems()} label={label} minLabelWidth="full" minListWidth="full" /> */}
            <SimpleLinkList
              items={getSimpleItems()}
              minWidth="full"
              selected={currentItem.id}
              label="Abstract Navigation"
            />
          </>
        )}
      </>
    );
  };

  return (
    <>
      <Box as="nav" aria-label="sidebar" display={{ base: 'none', lg: 'initial' }}>
        <Flex direction="column" alignItems="start" justifyContent="start" shadow="md" borderRadius="md" p={2}>
          {items.map((item) => (
            <NextLink key={item.name} href={item.href} passHref>
              <Link variant="dropdownItem" w="full" tabIndex={-1}>
                <Button
                  variant={item.current ? 'solid' : 'ghost'}
                  size="md"
                  aria-current={item.current ? 'page' : undefined}
                  isDisabled={item.disabled}
                  width="full"
                  justifyContent="start"
                  colorScheme="gray"
                  mb={1}
                >
                  {item.label}
                </Button>
              </Link>
            </NextLink>
          ))}
        </Flex>
      </Box>
      <Box as="nav" display={{ base: 'initial', lg: 'none' }}>
        {getTopMenu()}
      </Box>
    </>
  );
};

const getCount = (route: Routes, doc: IDocsEntity) => {
  if (!doc) {
    return 0;
  }

  switch (route) {
    case Routes.CITATIONS:
      return typeof doc.citation_count === 'number' ? doc.citation_count : 0;
    case Routes.REFERENCES:
      return typeof doc['[citations]'].num_references === 'number' ? doc['[citations]'].num_references : 0;
    case Routes.COREADS:
      return typeof doc.read_count === 'number' ? doc.read_count : 0;
    case Routes.SIMILAR:
      return typeof doc.abstract !== 'undefined' ? 1 : 0;
    default:
      return 0;
  }
};
