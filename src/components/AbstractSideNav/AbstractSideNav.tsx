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
import { useSettings } from '@/lib/useSettings';
import { IMenuItem, SideNavigationMenu, TopNavigationMenu } from '@/components/NavigationMenu';
import { IDocsEntity } from '@/api/search/types';
import { useGetGraphicsCount } from '@/api/graphics/graphics';
import { useHasMetrics } from '@/api/metrics/metrics';
import { useExportFormats } from '@/lib/useExportFormats';
import { ExportApiFormatKey } from '@/api/export/types';
import { ChatIcon, CheckCircleIcon } from '@chakra-ui/icons';

const abstractPath = '/abs';

const useGetItems = ({
  doc,
  graphicsCount,
  hasMetrics,
}: {
  doc: IDocsEntity;
  hasMetrics: boolean;
  graphicsCount: number;
}) => {
  const router = useRouter();
  const docId = router.query.id as string;

  const { settings } = useSettings();

  const { formatOptions } = useExportFormats();

  // for export citation menu link, it needs to go to user's default setting if logged in
  // otherwise go to bibtex
  const defaultExportFormat = settings.defaultExportFormat;
  const defaultExportFormatPath =
    typeof defaultExportFormat === 'string'
      ? formatOptions.find((f) => f.label === defaultExportFormat)?.value ?? ExportApiFormatKey.bibtex
      : ExportApiFormatKey.bibtex;

  const items: Record<Routes, IMenuItem> = {
    [Routes.ABSTRACT]: {
      id: Routes.ABSTRACT,
      href: { pathname: `${abstractPath}/${docId}/${Routes.ABSTRACT}` },
      label: 'Abstract',
      icon: <DocumentTextIcon />,
      tooltip: 'Basic information about this record',
    },
    [Routes.CITATIONS]: {
      id: Routes.CITATIONS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.CITATIONS}`, search: 'p=1' },
      label: 'Citations',
      icon: <CollectionIcon />,
      rightElement: <CountBadge count={doc?.citation_count ?? 0} />,
      disabled: doc?.citation_count <= 0,
      tooltip: 'View all records that cite this record',
    },
    [Routes.REFERENCES]: {
      id: Routes.REFERENCES,
      href: { pathname: `${abstractPath}/${docId}/${Routes.REFERENCES}`, search: 'p=1' },
      label: 'References',
      icon: <ClipboardListIcon />,
      rightElement: <CountBadge count={doc.reference_count ?? 0} />,
      disabled: doc.reference_count <= 0,
      tooltip: 'View all records cited by this record',
    },
    [Routes.CREDITS]: {
      id: Routes.CREDITS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.CREDITS}`, search: 'p=1' },
      label: 'Credits',
      icon: <CheckCircleIcon />,
      rightElement: <CountBadge count={doc.credit?.length ?? 0} />,
      disabled: !doc.credit || doc.credit.length === 0,
      tooltip: 'View all records that mention or acknowledge this record',
    },
    [Routes.MENTIONS]: {
      id: Routes.MENTIONS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.MENTIONS}`, search: 'p=1' },
      label: 'Mentions',
      icon: <ChatIcon />,
      rightElement: <CountBadge count={doc.mention?.length ?? 0} />,
      disabled: !doc.mention || doc.mention.length === 0,
      tooltip: 'View all records mentioned or acknowledged by this record',
    },
    [Routes.COREADS]: {
      id: Routes.COREADS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.COREADS}`, search: 'p=1' },
      label: 'Co-Reads',
      icon: <UsersIcon />,
      disabled: doc?.read_count <= 0,
      tooltip: 'View all records that have been read by those who read this record',
    },
    [Routes.SIMILAR]: {
      id: Routes.SIMILAR,
      href: { pathname: `${abstractPath}/${docId}/${Routes.SIMILAR}` },
      label: 'Similar Papers',
      icon: <DuplicateIcon />,
      disabled: !doc?.abstract,
      tooltip: 'View all records that are semantically similar to this record',
    },
    [Routes.VOLUMECONTENT]: {
      id: Routes.VOLUMECONTENT,
      href: { pathname: `${abstractPath}/${docId}/${Routes.VOLUMECONTENT}`, search: 'p=1' },
      label: 'Volume Content',
      icon: <TableIcon />,
      disabled: doc.property?.indexOf('TOC') === -1,
      tooltip: 'View other records published in the same volume/venue',
    },
    [Routes.GRAPHICS]: {
      id: Routes.GRAPHICS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.GRAPHICS}` },
      label: 'Graphics',
      icon: <PhotographIcon />,
      rightElement: null,
      disabled: graphicsCount === 0,
      tooltip: 'View thumbnails of graphics published in this record',
    },
    [Routes.METRICS]: {
      id: Routes.METRICS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.METRICS}` },
      label: 'Metrics',
      icon: <ChartPieIcon />,
      disabled: !hasMetrics,
      tooltip: 'View citation and usage statistics for this record',
    },
    [Routes.EXPORT]: {
      id: Routes.EXPORT,
      href: { pathname: `${abstractPath}/${docId}/${Routes.EXPORT}/${defaultExportFormatPath}` },
      label: 'Export Citation',
      icon: <DownloadIcon />,
      tooltip: 'Provide formatted citation formats for this record',
    },
  };

  return {
    menuItems: Object.values(items),
    // Finds the active item by comparing the current route
    activeItem: Object.entries(items).find(([route]) => router.asPath.indexOf(`/${route}`) > -1)?.[1],
  };
};

export interface IAbstractSideNavProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
}

export const AbstractSideNav = (props: IAbstractSideNavProps): ReactElement => {
  const { doc } = props;
  const graphicsCount = useGetGraphicsCount(doc?.bibcode);
  const hasMetrics = useHasMetrics(doc?.bibcode);
  const { menuItems, activeItem } = useGetItems({ doc, graphicsCount, hasMetrics });

  return (
    <div id="abstract-nav-menu">
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
    </div>
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
