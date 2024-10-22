import { Badge } from '@chakra-ui/react';

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
import { useSettings } from '@/lib/useSettings';
import { exportFormats } from '@/components/CitationExporter';
import { IMenuItem, SideNavigationMenu, TopNavigationMenu } from '@/components/NavigationMenu';
import { IDocsEntity } from '@/api/search/types';

const abstractPath = '/abs';

const useGetItems = ({ doc }: { doc: IDocsEntity; hasMetrics: boolean; graphicsCount: number }) => {
  const router = useRouter();
  const docId = router.query.id as string;

  const { settings } = useSettings();

  // for export citation menu link, it needs to go to user's default setting if logged in
  // otherwise go to bibtex
  const defaultExportFormat = settings.defaultExportFormat;
  const defaultExportFormatPath =
    typeof defaultExportFormat === 'string'
      ? values(exportFormats).find((f) => f.label === defaultExportFormat).value
      : 'bibtex';

  const items: Record<Routes, IMenuItem> = {
    [Routes.ABSTRACT]: {
      id: Routes.ABSTRACT,
      href: { pathname: `${abstractPath}/${docId}/${Routes.ABSTRACT}` },
      label: 'Abstract',
      icon: <DocumentTextIcon />,
    },
    [Routes.CITATIONS]: {
      id: Routes.CITATIONS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.CITATIONS}`, search: 'p=1' },
      label: 'Citations',
      icon: <CollectionIcon />,
      rightElement: <CountBadge count={doc?.citation_count ?? 0} />,
      disabled: doc?.citation_count <= 0,
    },
    [Routes.REFERENCES]: {
      id: Routes.REFERENCES,
      href: { pathname: `${abstractPath}/${docId}/${Routes.REFERENCES}`, search: 'p=1' },
      label: 'References',
      icon: <ClipboardListIcon />,
      rightElement: <CountBadge count={doc['[citations]']?.num_references ?? 0} />,
      disabled: doc['[citations]']?.num_references <= 0,
    },
    [Routes.COREADS]: {
      id: Routes.COREADS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.COREADS}`, search: 'p=1' },
      label: 'Co-Reads',
      icon: <UsersIcon />,
      disabled: doc?.read_count <= 0,
    },
    [Routes.SIMILAR]: {
      id: Routes.SIMILAR,
      href: { pathname: `${abstractPath}/${docId}/${Routes.SIMILAR}` },
      label: 'Similar Papers',
      icon: <DuplicateIcon />,
      disabled: !doc?.abstract,
    },
    [Routes.VOLUMECONTENT]: {
      id: Routes.VOLUMECONTENT,
      href: { pathname: `${abstractPath}/${docId}/${Routes.VOLUMECONTENT}`, search: 'p=1' },
      label: 'Volume Content',
      icon: <TableIcon />,
      disabled: doc.property?.indexOf('TOC') === -1,
    },
    [Routes.GRAPHICS]: {
      id: Routes.GRAPHICS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.GRAPHICS}` },
      label: 'Graphics',
      icon: <PhotographIcon />,
      rightElement: null,
      disabled: false,
    },
    [Routes.METRICS]: {
      id: Routes.METRICS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.METRICS}` },
      label: 'Metrics',
      icon: <ChartPieIcon />,
      disabled: false,
    },
    [Routes.EXPORT]: {
      id: Routes.EXPORT,
      href: { pathname: `${abstractPath}/${docId}/${Routes.EXPORT}/${defaultExportFormatPath}` },
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
  // const graphicsCount = useGetGraphicsCount(doc?.bibcode);
  // const hasMetrics = useHasMetrics(doc?.bibcode);
  const { menuItems, activeItem } = useGetItems({ doc, graphicsCount: 0, hasMetrics: true });

  return (
    <>
      {/* Large viewports */}
      <SideNavigationMenu
        menuItems={menuItems}
        activeItem={activeItem}
        display={{ base: 'none', lg: 'initial' }}
        w="72"
      />

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
    <Badge py={1} fontSize="xs" fontWeight="normal" borderRadius="xl" px={2} colorScheme="gray">
      {count.toLocaleString()}
    </Badge>
  );
};
