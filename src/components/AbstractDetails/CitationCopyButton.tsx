import { CheckIcon, ChevronDownIcon, CopyIcon } from '@chakra-ui/icons';
import { ButtonGroup, IconButton, Tooltip, useToast } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { mergeLeft } from 'ramda';
import { ReactElement, useEffect, useRef, useState } from 'react';

import { exportCitationKeys, fetchExportCitation } from '@/api/export/export';
import { getBibtexExportParams } from '@/api/export/getBibtexExportParams';
import { IExportApiParams } from '@/api/export/types';
import { DEFAULT_USER_DATA } from '@/api/user/models';
import { IADSApiUserDataResponse } from '@/api/user/types';
import { fetchUserSettings, userKeys } from '@/api/user/user';
import { ResolvedCitationFormat } from '@/lib/citationFormat';
import { copyToClipboard } from '@/lib/clipboard';
import { useCitationFormat } from '@/lib/useCitationFormat';
import { useSettings } from '@/lib/useSettings';

export interface ICitationCopyButtonProps {
  bibcode: string;
  onOpenModal: () => void;
}

const DEFAULT_TIMEOUT = 1500;

const buildExportParams = (
  format: ResolvedCitationFormat,
  settings: IADSApiUserDataResponse,
  bibcode: string,
): IExportApiParams => ({
  format: format.id,
  customFormat: format.customFormat,
  bibcode: [bibcode],
  ...getBibtexExportParams(settings, format.id),
});

export const CitationCopyButton = ({ bibcode, onOpenModal }: ICitationCopyButtonProps): ReactElement => {
  const { format, isReady, resolveWithSettings } = useCitationFormat();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const toast = useToast();
  const router = useRouter();
  const currentBibcodeRef = useRef(bibcode);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    currentBibcodeRef.current = bibcode;
  }, [bibcode]);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeoutId = setTimeout(() => setHasCopied(false), DEFAULT_TIMEOUT);
    return () => clearTimeout(timeoutId);
  }, [hasCopied]);

  const copyCitation = (resolvedFormat: ResolvedCitationFormat, resolvedSettings: IADSApiUserDataResponse): void => {
    const requestedBibcode = bibcode;
    const params = buildExportParams(resolvedFormat, resolvedSettings, requestedBibcode);
    const content = queryClient
      .fetchQuery({ queryKey: exportCitationKeys.primary(params), queryFn: fetchExportCitation, meta: { params } })
      .then((data) => data.export ?? '');
    content.catch((): void => undefined);

    copyToClipboard({ content, asHtml: resolvedFormat.asHtml })
      .then(() => {
        if (currentBibcodeRef.current !== requestedBibcode) {
          return;
        }
        toast({ title: `Copied ${resolvedFormat.name} citation to clipboard.`, status: 'success' });
        setHasCopied(true);
      })
      .catch(() => {
        if (currentBibcodeRef.current !== requestedBibcode) {
          return;
        }
        toast({ title: 'Could not copy the citation.', status: 'error' });
      });
  };

  const fetchFreshFormat = (): Promise<{ format: ResolvedCitationFormat; settings: IADSApiUserDataResponse }> =>
    queryClient
      .fetchQuery({ queryKey: userKeys.getUserSettings(), queryFn: fetchUserSettings })
      .then((freshSettings) => {
        const mergedSettings = mergeLeft<IADSApiUserDataResponse, IADSApiUserDataResponse>(
          freshSettings,
          DEFAULT_USER_DATA,
        );
        return { format: resolveWithSettings(mergedSettings), settings: mergedSettings };
      });

  const copyWithFreshSettings = (): void => {
    fetchFreshFormat()
      .then(({ format: freshFormat, settings: mergedSettings }) => {
        copyCitation(freshFormat, mergedSettings);
      })
      .catch(() => {
        toast({ title: 'Could not copy the citation.', status: 'error' });
      });
  };

  const handleCopyClick = (): void => {
    if (isReady) {
      copyCitation(format, settings);
      return;
    }
    copyWithFreshSettings();
  };

  const routeToFormat = (resolvedFormat: ResolvedCitationFormat): void => {
    if (resolvedFormat.isInModal) {
      onOpenModal();
      return;
    }
    const query = resolvedFormat.customFormatId ? `?customFormatId=${resolvedFormat.customFormatId}` : '';
    void router.push(`/abs/${encodeURIComponent(bibcode)}/exportcitation/${resolvedFormat.id}${query}`);
  };

  const handleChevronClick = (): void => {
    if (isReady) {
      routeToFormat(format);
      return;
    }
    const requestedBibcode = bibcode;
    fetchFreshFormat()
      .then(({ format: freshFormat }) => {
        if (currentBibcodeRef.current !== requestedBibcode) {
          return;
        }
        routeToFormat(freshFormat);
      })
      .catch(() => {
        if (currentBibcodeRef.current !== requestedBibcode) {
          return;
        }
        routeToFormat(format);
      });
  };

  return (
    <ButtonGroup
      isAttached
      size="xs"
      variant="outline"
      aria-label="Citation"
      mx={2}
      display="inline-flex"
      verticalAlign="middle"
      whiteSpace="nowrap"
    >
      <Tooltip label={`Copy citation (${format.name})`}>
        <IconButton
          aria-label={`Copy citation (${format.name})`}
          icon={hasCopied ? <CheckIcon color="green.500" data-testid="citation-copy-confirmation" /> : <CopyIcon />}
          onClick={handleCopyClick}
          data-tour="quick-citation-copy"
          minW={10}
        />
      </Tooltip>
      <Tooltip label="Change citation format">
        <IconButton aria-label="Change citation format" icon={<ChevronDownIcon />} onClick={handleChevronClick} />
      </Tooltip>
    </ButtonGroup>
  );
};
