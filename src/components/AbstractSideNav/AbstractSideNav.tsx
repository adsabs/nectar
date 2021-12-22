import { IDocsEntity } from '@api';
import { Flex, Text, Badge, Box, Stack, HStack } from '@chakra-ui/layout';
import { Button } from '@chakra-ui/button';
import { Menu, MenuButton, MenuList, MenuItem } from '@chakra-ui/menu';
import { DocumentIcon } from '@heroicons/react/outline';
import { useViewport, Viewport } from '@hooks';
import { useBaseRouterPath } from '@utils';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { last } from 'ramda';
import { HTMLAttributes, ReactElement } from 'react';
import { navigation, Routes } from './model';
import { useHasGraphics, useHasMetrics } from './queries';
import { ChevronDownIcon } from '@chakra-ui/icons';

export interface IAbstractSideNavProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSideNav = ({ doc }: IAbstractSideNavProps): ReactElement => {
  const router = useRouter();
  const { basePath } = useBaseRouterPath();
  const subPage = last(basePath.split('/'));
  const viewport = useViewport();
  const hasGraphics = useHasGraphics(doc);
  const hasMetrics = useHasMetrics(doc);
  const hasToc = doc.property ? doc.property.indexOf('TOC') > -1 : false;

  const useCount = [Routes.CITATIONS, Routes.REFERENCES];

  const items = navigation.map((item) => {
    const Icon = item.icon || DocumentIcon;
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
        <Icon className="2-6 mr-3 h-6" aria-hidden={true} />
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
      icon: Icon,
      showCount,
    };
  });

  const getTopMenu = () => {
    const currentItem = items.find((item) => item.current) ?? items[0];

    const { icon: Icon, showCount, count } = currentItem;

    const label = (
      <Flex
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="gray.50"
        borderRadius="md"
        px={3}
        py={2}
      >
        <HStack>
          <Icon className="mr-3 w-6 h-6" aria-hidden="true" />
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
        </HStack>
        <ChevronDownIcon />
      </Flex>
    );

    return (
      <Menu matchWidth>
        <MenuButton>{label}</MenuButton>
        <MenuList>
          {items.map((item) => (
            <MenuItem
              key={item.id}
              isDisabled={item.disabled}
              backgroundColor={item.current ? 'gray.100' : 'transparent'}
              mb={1}
            >
              <NextLink key={item.name} href={item.href}>
                <Box width="full">{item.label}</Box>
              </NextLink>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    );
  };

  return (
    <>
      {viewport >= Viewport.LG ? (
        <nav aria-label="sidebar">
          <Flex direction="column" alignItems="start" justifyContent="start" shadow="md" borderRadius="md" p={2}>
            {items.map((item) => (
              <NextLink key={item.name} href={item.href} passHref>
                <Button
                  variant={item.current ? 'solid' : 'ghost'}
                  size="md"
                  aria-current={item.current ? 'page' : undefined}
                  isDisabled={item.disabled}
                  leftIcon={<item.icon />}
                  width="full"
                  justifyContent="start"
                  colorScheme="gray"
                  mb={1}
                >
                  {item.label}
                </Button>
              </NextLink>
            ))}
          </Flex>
        </nav>
      ) : (
        getTopMenu()
      )}
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
