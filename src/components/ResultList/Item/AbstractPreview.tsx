import { Box, CircularProgress, Collapse, Flex, IconButton, Text, Tooltip, useToast, VStack } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { SafeAbstract } from '@/components/SafeAbstract';
import { SimpleLink } from '@/components/SimpleLink';
import { useColorModeColors } from '@/lib/useColorModeColors';
import { ReactElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IDocsEntity } from '@/api/search/types';
import { useGetAbstractPreview } from '@/api/search/search';
import { useStore } from '@/store';

export interface IAbstractPreviewProps {
  bibcode: IDocsEntity['bibcode'];
  abstract?: string;
  isFetchingAbstract?: boolean;
  allowAbstracts?: boolean;
}

const text = {
  error: 'Problem loading abstract preview' as const,
  noAbstract: 'No Abstract' as const,
};

// Results render server-side, where useLayoutEffect warns. Same shape as
// useRenderSpan.ts and pages/search/index.tsx.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const AbstractPreview = ({
  bibcode,
  abstract,
  isFetchingAbstract,
  allowAbstracts = true,
}: IAbstractPreviewProps): ReactElement => {
  const showAbstracts = useStore((state) => state.showAbstracts);
  // allowAbstracts mirrors allowHighlight: non-search lists (e.g.
  // AbstractRefList) opt out of the global toggle.
  const effectiveShowAbstracts = showAbstracts && allowAbstracts;
  const [show, setShow] = useState(effectiveShowAbstracts);
  const toast = useToast();
  const colors = useColorModeColors();
  const clampRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Sync local expand state to the global toggle; the per-item chevron can
  // still override it afterward.
  useEffect(() => {
    setShow(effectiveShowAbstracts);
  }, [effectiveShowAbstracts]);
  const { data, isFetching } = useGetAbstractPreview(
    { bibcode },
    {
      // While the global toggle is on, abstracts come from the primary
      // results or the bulk map, never per-item — skip this fetch to avoid
      // racing the bulk one.
      enabled: show && abstract === undefined && !effectiveShowAbstracts,
      keepPreviousData: true,
      onError: () => {
        // show toast notification on error, and close drawer
        toast({ status: 'error', description: text.error });
        setShow(false);
      },
    },
  );

  const abstractHtml = abstract ?? data?.docs[0]?.abstract;
  const isLoadingAbstract = isFetching || isFetchingAbstract;

  // Overflow is layout-dependent and must be measured; only then do we clamp
  // and show the "view full" link.
  useIsomorphicLayoutEffect(() => {
    const el = clampRef.current;
    if (!el || !show) {
      return;
    }
    const measure = () => setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [abstractHtml, show]);

  return (
    <Flex direction="column" justifyContent="center" alignContent="center">
      <Collapse in={show} animateOpacity>
        {abstractHtml ? (
          <>
            <Box position="relative">
              <Box ref={clampRef} data-testid="abstract-clamp" maxH="24em" overflowY="hidden">
                <SafeAbstract html={abstractHtml} fontSize="md" mt={1} wordBreak="break-word" />
              </Box>
              {isOverflowing && (
                <Box
                  aria-hidden="true"
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  h="4em"
                  bgGradient={`linear(to-b, transparent, ${colors.background})`}
                  pointerEvents="none"
                />
              )}
            </Box>
            {isOverflowing && bibcode && (
              <SimpleLink href={`/abs/${encodeURIComponent(bibcode)}/abstract`} fontSize="sm">
                View full abstract
              </SimpleLink>
            )}
          </>
        ) : isLoadingAbstract ? (
          <Flex justifyContent="center" py={2}>
            <CircularProgress isIndeterminate size="20px" aria-label="loading abstract" />
          </Flex>
        ) : (
          <Text fontSize="md" mt={1}>
            {text.noAbstract}
          </Text>
        )}
      </Collapse>
      <VStack>
        <Tooltip label={show ? 'Hide abstract' : 'Show abstract'}>
          <IconButton
            aria-label={show ? 'hide abstract' : 'show abstract'}
            size="xs"
            onClick={() => setShow(!show)}
            disabled={false}
            variant="unstyled"
            width="fit-content"
            display="flex"
            fontSize="md"
            isLoading={isFetching}
            icon={show ? <ChevronUpIcon /> : <ChevronDownIcon />}
            data-tour="view-abstract"
          />
        </Tooltip>
      </VStack>
    </Flex>
  );
};
