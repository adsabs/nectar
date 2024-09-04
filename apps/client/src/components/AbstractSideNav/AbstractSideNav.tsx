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
import { values } from 'ramda';
import { HTMLAttributes, ReactElement } from 'react';

import { IDocsEntity, useGetGraphicsCount, useHasMetrics } from '@/api';
import { exportFormats, IMenuItem, SideNavigationMenu, TopNavigationMenu } from '@/components';
import { useSettings } from '@/lib/useSettings';

import { Routes } from './types';

const abstractPath = '/abs';

const useGetItems = ({
  doc,
  hasMetrics,
  graphicsCount,
  activeId,
}: {
  doc?: IDocsEntity; // Marked as optional to handle undefined cases
  hasMetrics: boolean;
  graphicsCount: number;
  activeId?: Routes;
}) => {
  const router = useRouter();
  const docId = router.query.id as string;

  const { settings } = useSettings();

  // Default to 'bibtex' if no user settings are available
  const defaultExportFormat = settings?.defaultExportFormat;
  const defaultExportFormatPath =
    typeof defaultExportFormat === 'string'
      ? values(exportFormats).find((f) => f.label === defaultExportFormat)?.value ?? 'bibtex'
      : 'bibtex';

  const citationCount = doc?.citation_count ?? 0;
  const referenceCount = doc?.['[citations]']?.num_references ?? 0;
  const readCount = doc?.read_count ?? 0;
  const hasAbstract = Boolean(doc?.abstract);
  const hasTOCProperty = doc?.property?.indexOf('TOC') !== -1;

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
      rightElement: citationCount > 0 ? <CountBadge count={citationCount} /> : null,
      disabled: citationCount <= 0,
    },
    [Routes.REFERENCES]: {
      id: Routes.REFERENCES,
      href: { pathname: `${abstractPath}/${docId}/${Routes.REFERENCES}`, search: 'p=1' },
      label: 'References',
      icon: <ClipboardListIcon />,
      rightElement: referenceCount > 0 ? <CountBadge count={referenceCount} /> : null,
      disabled: referenceCount <= 0,
    },
    [Routes.COREADS]: {
      id: Routes.COREADS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.COREADS}`, search: 'p=1' },
      label: 'Co-Reads',
      icon: <UsersIcon />,
      disabled: readCount <= 0,
    },
    [Routes.SIMILAR]: {
      id: Routes.SIMILAR,
      href: { pathname: `${abstractPath}/${docId}/${Routes.SIMILAR}` },
      label: 'Similar Papers',
      icon: <DuplicateIcon />,
      disabled: !hasAbstract,
    },
    [Routes.VOLUMECONTENT]: {
      id: Routes.VOLUMECONTENT,
      href: { pathname: `${abstractPath}/${docId}/${Routes.VOLUMECONTENT}`, search: 'p=1' },
      label: 'Volume Content',
      icon: <TableIcon />,
      disabled: hasTOCProperty,
    },
    [Routes.GRAPHICS]: {
      id: Routes.GRAPHICS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.GRAPHICS}` },
      label: 'Graphics',
      icon: <PhotographIcon />,
      rightElement: graphicsCount > 0 ? <CountBadge count={graphicsCount} /> : null,
      disabled: graphicsCount === 0,
    },
    [Routes.METRICS]: {
      id: Routes.METRICS,
      href: { pathname: `${abstractPath}/${docId}/${Routes.METRICS}` },
      label: 'Metrics',
      icon: <ChartPieIcon />,
      disabled: !hasMetrics,
    },
    [Routes.EXPORT]: {
      id: Routes.EXPORT,
      href: { pathname: `${abstractPath}/${docId}/${Routes.EXPORT}/${defaultExportFormatPath}` },
      label: 'Export Citation',
      icon: <DownloadIcon />,
    },
  };

  // Determine the active item, or default to the first item if no match is found
  const activeItem =
    Object.entries(items).find(([route]) => {
      if (activeId) {
        return route === activeId;
      }
      return router.asPath.indexOf(`/${route}`) > -1;
    })?.[1] || Object.values(items)[0];

  return {
    menuItems: Object.values(items),
    activeItem,
  };
};

export interface IAbstractSideNavProps extends HTMLAttributes<HTMLDivElement> {
  doc?: IDocsEntity;
  activeId?: Routes;
}

export const AbstractSideNav = (props: IAbstractSideNavProps): ReactElement => {
  const { doc, activeId } = props;

  const graphicsCount = useGetGraphicsCount(doc?.bibcode, { enabled: !!doc });
  const hasMetrics = useHasMetrics(doc?.bibcode, { enabled: !!doc });

  const { menuItems, activeItem } = useGetItems({
    doc,
    graphicsCount: graphicsCount ?? 0,
    hasMetrics: hasMetrics ?? false,
    activeId,
  });

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
const CountBadge = ({ count }: { count: number }) => {
  if (typeof count !== 'number' || count <= 0) {
    return null;
  }
  return (
    <Badge py={1} fontSize="xs" fontWeight="normal" borderRadius="xl" px={2} colorScheme="gray">
      {count.toLocaleString()}
    </Badge>
  );
};
