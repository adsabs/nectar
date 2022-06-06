import { IDocsEntity, useHasGraphics, useHasMetrics } from '@api';
import { Button } from '@chakra-ui/button';
import { Badge, Box, Flex, Stack, Text } from '@chakra-ui/layout';
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/menu';
import { SimpleLinkList } from '@components';
import { ItemType } from '@components/Dropdown/types';
import {
  ChartPieIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  CollectionIcon,
  DocumentIcon,
  DocumentTextIcon,
  DownloadIcon,
  DuplicateIcon,
  PhotographIcon,
  TableIcon,
  UsersIcon,
} from '@heroicons/react/solid';
import { useIsClient } from '@hooks/useIsClient';
import { noop, parseQueryFromUrl } from '@utils';
import NextLink, { LinkProps } from 'next/link';
import { useRouter } from 'next/router';
import { cloneElement, HTMLAttributes, ReactElement } from 'react';
import { Routes } from './types';

const useGetItems = ({
  doc,
  hasMetrics,
  hasGraphics,
}: {
  doc: IDocsEntity;
  hasMetrics: boolean;
  hasGraphics: boolean;
}) => {
  const router = useRouter();

  const items: Record<Routes, IItemProps> = {
    [Routes.ABSTRACT]: {
      route: Routes.ABSTRACT,
      label: 'Abstract',
      icon: <DocumentTextIcon />,
      noPagination: true,
    },
    [Routes.CITATIONS]: {
      route: Routes.CITATIONS,
      label: 'Citations',
      icon: <CollectionIcon />,
      count: doc?.citation_count ?? 0,
    },
    [Routes.REFERENCES]: {
      route: Routes.REFERENCES,
      label: 'References',
      icon: <ClipboardListIcon />,
      count: doc['[citations]']?.num_references ?? 0,
    },
    [Routes.COREADS]: {
      route: Routes.COREADS,
      label: 'Co-Reads',
      icon: <UsersIcon />,
      disabled: doc?.read_count <= 0,
    },
    [Routes.SIMILAR]: {
      route: Routes.SIMILAR,
      label: 'Similar Papers',
      icon: <DuplicateIcon />,
      disabled: !doc?.abstract,
    },
    [Routes.VOLUMECONTENT]: {
      route: Routes.VOLUMECONTENT,
      label: 'Volume Content',
      icon: <TableIcon />,
      disabled: doc.property?.indexOf('TOC') > -1,
    },
    [Routes.GRAPHICS]: {
      route: Routes.GRAPHICS,
      label: 'Graphics',
      icon: <PhotographIcon />,
      disabled: !hasGraphics,
      noPagination: true,
    },
    [Routes.METRICS]: {
      route: Routes.METRICS,
      label: 'Metrics',
      icon: <ChartPieIcon />,
      disabled: !hasMetrics,
      noPagination: true,
    },
    [Routes.EXPORT]: {
      route: Routes.EXPORT,
      label: 'Export Citation',
      icon: <DownloadIcon />,

      // exportcitation has a more complex route, so a custom config is passed here
      linkProps: (docId) => ({
        href: `/abs/[id]/${Routes.EXPORT}/[format]`,
        as: `/abs/${docId}/${Routes.EXPORT}/bibtex`,
      }),
    },
  };

  return {
    items,

    // Finds the active item by comparing the current route
    activeItem: Object.keys(items).find((route) => router.asPath.indexOf(`/${route}`) > -1) as Routes,
  };
};
export interface IAbstractSideNavProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSideNav = (props: IAbstractSideNavProps): ReactElement => {
  const isClient = useIsClient();
  return isClient ? <Component {...props} /> : <Static {...props} />;
};

const Component = (props: IAbstractSideNavProps): ReactElement => {
  const { doc } = props;
  const hasGraphics = useHasGraphics(doc.bibcode);
  const hasMetrics = useHasMetrics(doc.bibcode);
  const { items, activeItem } = useGetItems({ doc, hasGraphics, hasMetrics });

  return (
    <>
      {/* Large viewports */}
      <Box as="nav" aria-label="sidebar" display={{ base: 'none', lg: 'initial' }}>
        <Flex direction="column" alignItems="start" justifyContent="start" shadow="md" borderRadius="md" p={2}>
          {Object.values(items).map((itemProps) => (
            <Item key={itemProps.route} {...itemProps} />
          ))}
        </Flex>
      </Box>

      {/* Small viewports */}
      <Box as="nav" display={{ base: 'initial', lg: 'none' }}>
        <Menu matchWidth>
          <MenuButton width="full">
            <TopMenuButton {...items[activeItem]} />
          </MenuButton>
          <MenuList>
            {Object.values(items).map((itemProps) => (
              <TopMenuItem key={itemProps.route} {...itemProps} />
            ))}
          </MenuList>
        </Menu>
      </Box>
    </>
  );
};

interface IItemProps {
  disabled?: boolean;
  label: string;
  count?: number;
  route: string;
  icon: ReactElement;
  noPagination?: boolean;
  linkProps?: (id: string) => LinkProps;
}

/**
 * Basic item
 * Rendered as as button link
 */
const Item = (props: IItemProps) => {
  const { disabled = false, label, count, noPagination, route, icon = <DocumentIcon />, linkProps = noop } = props;
  const router = useRouter();

  let isDisabled = disabled;
  if (typeof count === 'number' && count <= 0) {
    isDisabled = true;
  }

  const { id: docId } = parseQueryFromUrl<{ id: string }>(router.query);
  const active = router.asPath.indexOf(`/${route}`) > -1;

  return (
    <NextLink
      href={{ pathname: `/abs/[id]/${route}`, search: noPagination ? '' : 'p=1' }}
      as={{ pathname: `/abs/${docId}/${route}`, search: noPagination ? '' : 'p=1' }}
      passHref
      {...linkProps(docId)}
    >
      <Button
        as="a"
        w="full"
        variant={active ? 'solid' : 'ghost'}
        size="md"
        aria-current={active ? 'page' : undefined}
        isDisabled={isDisabled}
        width="full"
        justifyContent="start"
        colorScheme="gray"
        mb={1}
        color="gray.700"
        leftIcon={cloneElement(icon, { className: 'w-6 h-6', 'aria-hidden': true })}
      >
        {label}
        <CountBadge count={count} />
      </Button>
    </NextLink>
  );
};

/**
 * Basic top menu item
 */
const TopMenuItem = (props: IItemProps) => {
  const { disabled = false, label, count, route, icon = <DocumentIcon />, linkProps = noop } = props;
  const router = useRouter();

  let isDisabled = disabled;
  if (typeof count === 'number' && count <= 0) {
    isDisabled = true;
  }

  const active = router.asPath.indexOf(`/${route}`) > -1;
  const { id: docId } = parseQueryFromUrl<{ id: string }>(router.query);

  return (
    <MenuItem isDisabled={isDisabled} backgroundColor={active ? 'gray.100' : 'transparent'} mb={1}>
      <NextLink href={`/abs/[id]/${route}`} as={`/abs/${docId}/${route}`} passHref {...linkProps(docId)}>
        <Box width="full">
          <Stack direction="row" alignItems="center">
            {cloneElement(icon, { className: 'mr-3 w-6 h-6', 'aria-hidden': true })}
            <Text fontWeight="normal">{label}</Text>
            <CountBadge count={count} />
          </Stack>
        </Box>
      </NextLink>
    </MenuItem>
  );
};

/**
 * Top menu trigger button
 */
const TopMenuButton = (props: IItemProps) => {
  const { label, count, icon } = props;
  return (
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
        {cloneElement(icon, { className: 'mr-3 w-6 h-6', 'aria-hidden': true })}
        <Text>{label}</Text>
        <CountBadge count={count} />
      </Flex>
      <ChevronDownIcon className="w-6 h-6" />
    </Flex>
  );
};

/**
 * Small badge to show count value
 */
const CountBadge = ({ count }: { count: number }): ReactElement => {
  if (typeof count !== 'number' || count <= 0) {
    return null;
  }
  return (
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
  );
};

/**
 * Static component for non-js
 * This component will be rendered on the server by default
 */
const Static = (props: IAbstractSideNavProps) => {
  const { doc } = props;
  const hasGraphics = useHasGraphics(doc.bibcode);
  const hasMetrics = useHasMetrics(doc.bibcode);
  const { items, activeItem } = useGetItems({ doc, hasGraphics, hasMetrics });
  const getSimpleItems = (): ItemType[] => {
    const res = Object.values(items).map((item) => ({
      id: item.route,
      label: (
        <>
          <Stack direction="row" alignItems="center">
            {cloneElement(item.icon, { className: 'mr-3 w-6 h-6', 'aria-hidden': true })}
            <Text fontWeight="normal">{item.label}</Text>
            <CountBadge count={item.count} />
          </Stack>
        </>
      ),

      // TODO: need to refactor this so it supports dynamic routes (i.e. linkProps)
      path:
        item.route === Routes.EXPORT ? `/abs/${doc.bibcode}/${item.route}/bibtex` : `/abs/${doc.bibcode}/${item.route}`,
      disabled: item.disabled,
    }));
    return res;
  };

  return (
    <>
      {/* Large viewports */}
      <Box as="nav" aria-label="sidebar" display={{ base: 'none', lg: 'initial' }}>
        <Flex direction="column" alignItems="start" justifyContent="start" shadow="md" borderRadius="md" p={2}>
          {Object.values(items).map((itemProps) => (
            <Item key={itemProps.route} {...itemProps} />
          ))}
        </Flex>
      </Box>

      {/* Small viewports */}
      <Box as="nav" display={{ base: 'initial', lg: 'none' }}>
        <SimpleLinkList items={getSimpleItems()} minWidth="full" selected={activeItem} label="Abstract Navigation" />
      </Box>
    </>
  );
};
