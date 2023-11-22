import { IDocsEntity, useGetUserSettings, useHasGraphics, useHasMetrics } from '@api';
import { Badge } from '@chakra-ui/react';
import { IMenuItem, SideNavigationMenu, TopNavigationMenu, exportFormats, DEFAULT_USER_DATA } from '@components';
import {
  ArrowDownIcon as DownloadIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon as ClipboardListIcon,
  DocumentDuplicateIcon as DuplicateIcon,
  DocumentTextIcon,
  InboxStackIcon as CollectionIcon,
  PhotoIcon as PhotographIcon,
  TableCellsIcon as TableIcon,
  UsersIcon,
} from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';
import { HTMLAttributes, ReactElement } from 'react';
import { Routes } from './types';
import { values } from 'ramda';
import { useSession } from '@lib/useSession';

const abstractPath = '/abs';

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
  const docId = router.query.id as string;

  const { isAuthenticated } = useSession();

  const { data: settings } = useGetUserSettings({
    enabled: isAuthenticated,
  });

  // for export citation menu link, it needs to go to user's default setting if logged in
  // otherwise go to bibtex
  const defaultExportFormat = settings?.defaultExportFormat ?? DEFAULT_USER_DATA.defaultExportFormat;
  const defaultExportFormatPath =
    typeof defaultExportFormat === 'string'
      ? values(exportFormats).find((f) => f.label === defaultExportFormat).value
      : 'bibtex';

  const items: Record<Routes, IMenuItem> = {
    [Routes.ABSTRACT]: {
      id: Routes.ABSTRACT,
      href: { pathname: `${abstractPath}/[id]/${Routes.ABSTRACT}` },
      hrefAs: { pathname: `${abstractPath}/${docId}/${Routes.ABSTRACT}` },
      label: 'Abstract',
      icon: <DocumentTextIcon />,
    },
    [Routes.CITATIONS]: {
      id: Routes.CITATIONS,
      href: { pathname: `${abstractPath}/[id]/${Routes.CITATIONS}`, search: 'p=1' },
      hrefAs: { pathname: `${abstractPath}/${docId}/${Routes.CITATIONS}`, search: 'p=1' },
      label: 'Citations',
      icon: <CollectionIcon />,
      rightElement: <CountBadge count={doc?.citation_count ?? 0} />,
      disabled: doc?.citation_count <= 0,
    },
    [Routes.REFERENCES]: {
      id: Routes.REFERENCES,
      href: { pathname: `${abstractPath}/[id]/${Routes.REFERENCES}`, search: 'p=1' },
      hrefAs: { pathname: `${abstractPath}/${docId}/${Routes.REFERENCES}`, search: 'p=1' },
      label: 'References',
      icon: <ClipboardListIcon />,
      rightElement: <CountBadge count={doc['[citations]']?.num_references ?? 0} />,
      disabled: doc['[citations]']?.num_references <= 0,
    },
    [Routes.COREADS]: {
      id: Routes.COREADS,
      href: { pathname: `${abstractPath}/[id]/${Routes.COREADS}`, search: 'p=1' },
      hrefAs: { pathname: `${abstractPath}/${docId}/${Routes.COREADS}`, search: 'p=1' },
      label: 'Co-Reads',
      icon: <UsersIcon />,
      disabled: doc?.read_count <= 0,
    },
    [Routes.SIMILAR]: {
      id: Routes.SIMILAR,
      href: { pathname: `${abstractPath}/[id]/${Routes.SIMILAR}`, search: 'p=1' },
      hrefAs: { pathname: `${abstractPath}/${docId}/${Routes.SIMILAR}` },
      label: 'Similar Papers',
      icon: <DuplicateIcon />,
      disabled: !doc?.abstract,
    },
    [Routes.VOLUMECONTENT]: {
      id: Routes.VOLUMECONTENT,
      href: { pathname: `${abstractPath}/[id]/${Routes.VOLUMECONTENT}`, search: 'p=1' },
      hrefAs: { pathname: `${abstractPath}/${docId}/${Routes.VOLUMECONTENT}`, search: 'p=1' },
      label: 'Volume Content',
      icon: <TableIcon />,
      disabled: doc.property?.indexOf('TOC') > -1,
    },
    [Routes.GRAPHICS]: {
      id: Routes.GRAPHICS,
      href: { pathname: `${abstractPath}/[id]/${Routes.GRAPHICS}` },
      hrefAs: { pathname: `${abstractPath}/${docId}/${Routes.GRAPHICS}` },
      label: 'Graphics',
      icon: <PhotographIcon />,
      disabled: !hasGraphics,
    },
    [Routes.METRICS]: {
      id: Routes.METRICS,
      href: { pathname: `${abstractPath}/[id]/${Routes.METRICS}` },
      hrefAs: { pathname: `${abstractPath}/${docId}/${Routes.METRICS}` },
      label: 'Metrics',
      icon: <ChartPieIcon />,
      disabled: !hasMetrics,
    },
    [Routes.EXPORT]: {
      id: Routes.EXPORT,
      href: { pathname: `${abstractPath}/[id]/${Routes.EXPORT}/[format]` },
      hrefAs: { pathname: `${abstractPath}/${docId}/${Routes.EXPORT}/${defaultExportFormatPath}` },
      label: 'Export Citation',
      icon: <DownloadIcon />,
    },
  };

  return {
    menuItems: Object.values(items),
    // Finds the active item by comparing the current route
    activeItem: Object.entries(items).find(([route]) => router.asPath.indexOf(`/${route}`) > -1)[1],
  };
};

export interface IAbstractSideNavProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSideNav = (props: IAbstractSideNavProps): ReactElement => {
  const { doc } = props;
  const hasGraphics = useHasGraphics(doc?.bibcode);
  const hasMetrics = useHasMetrics(doc?.bibcode);
  const { menuItems, activeItem } = useGetItems({ doc, hasGraphics, hasMetrics });

  return (
    <>
      {/* Large viewports */}
      <SideNavigationMenu menuItems={menuItems} activeItem={activeItem} display={{ base: 'none', lg: 'initial' }} />

      {/* Small viewports */}
      <TopNavigationMenu
        menuItems={menuItems}
        activeItem={activeItem}
        display={{ base: 'initial', lg: 'none' }}
        mx={2}
      />
    </>
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
    <Badge mx={3} py={1} fontSize="xs" fontWeight="normal" borderRadius="xl" px={2} backgroundColor="gray.50">
      {count}
    </Badge>
  );
};
