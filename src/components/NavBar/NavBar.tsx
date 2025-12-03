import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  CloseButton,
  Flex,
  Heading,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { ScixAndTextLogo_H } from '@/components/images/ScixAndTextLogo-H';
import { keyframes } from '@emotion/react';
import dynamic from 'next/dynamic';
import { FC, useEffect, useRef, useState } from 'react';
import { SimpleLink } from '@/components/SimpleLink';
import { useRouter } from 'next/router';
import shallow from 'zustand/shallow';
import { useStore } from '@/store';
import { AppMode } from '@/types';
import {
  appModeToDisciplineParam,
  getAppModeLabel,
  mapDisciplineParamToAppMode,
  normalizeDisciplineParam,
  syncUrlDisciplineParam,
} from '@/utils/appMode';
import { AdsModeToggle } from './AdsModeToggle';

const AppModeDropdown = dynamic<Record<string, never>>(
  () =>
    import('./AppModeDropdown').then((mod) => ({
      default: mod.AppModeDropdown,
    })),
  {
    ssr: false,
  },
);

const NavMenus = dynamic<Record<string, never>>(
  () =>
    import('./NavMenus').then((mod) => ({
      default: mod.NavMenus,
    })),
  { ssr: false },
);

export const NavBar: FC = () => {
  return (
    <Box as="nav" backgroundColor="gray.900" position="relative" zIndex="overlay">
      <Flex direction="row" alignItems="center" justifyContent="space-between" mx={4} my={2}>
        <HStack spacing={3}>
          <SimpleLink href="/" _hover={{ textDecoration: 'none' }}>
            <HStack cursor="pointer" spacing={1}>
              <Heading as="h1" size="sm">
                <Icon as={ScixAndTextLogo_H} width="6em" height="3em" color="gray.50" aria-label="Scix Home" />
              </Heading>
            </HStack>
          </SimpleLink>
          <AppModeDropdown />
          <AppModeUrlNotice />
        </HStack>
        <HStack>
          <AdsModeToggle source="navbar" />
          <NavMenus />
        </HStack>
      </Flex>
    </Box>
  );
};

const AppModeUrlNotice: FC = () => {
  const router = useRouter();
  const [
    mode,
    setMode,
    modeNoticeVisible,
    showModeNotice,
    dismissModeNotice,
    setUrlModePrevious,
    urlModeOverride,
    setUrlModeOverride,
    urlModeUserSelected,
    setUrlModeUserSelected,
    urlModePendingParam,
    setUrlModePendingParam,
  ]: [
    AppMode,
    (mode: AppMode) => void,
    boolean,
    () => void,
    () => void,
    (mode: AppMode | null) => void,
    AppMode | null,
    (mode: AppMode | null) => void,
    boolean,
    (selected: boolean) => void,
    string | null,
    (param: string | null) => void,
  ] = useStore(
    (state) => [
      state.mode,
      state.setMode,
      state.modeNoticeVisible,
      state.showModeNotice,
      state.dismissModeNotice,
      state.setUrlModePrevious,
      state.urlModeOverride,
      state.setUrlModeOverride,
      state.urlModeUserSelected,
      state.setUrlModeUserSelected,
      state.urlModePendingParam,
      state.setUrlModePendingParam,
    ],
    shallow,
  );
  const urlModePrevious = useStore((state) => state.urlModePrevious);
  const [previousMode, setPreviousMode] = useState<AppMode | null>(null);
  const [appliedMode, setAppliedMode] = useState<AppMode | null>(null);
  const [visible, setVisible] = useState(false);
  const handledParam = useRef<string | null>(null);
  const pulse = keyframes`
    0% {border: solid 1px;} 50% {border: solid 4px;} 100% {border: solid 1px;}
  `;

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    // Only honor d param on /search routes; ignore elsewhere to prevent spurious notices/loops.
    const rawParam = router.pathname === '/search' ? router.query?.d : null;
    const mappedMode = mapDisciplineParamToAppMode(rawParam);
    if (!mappedMode) {
      return;
    }
    const normalizedParam = normalizeDisciplineParam(rawParam);
    if (!normalizedParam) {
      return;
    }

    const targetParam = appModeToDisciplineParam(mode);

    // If user manually changed mode, ignore any stale URL param until the URL matches the current mode,
    // then clear flags/notice without reapplying.
    if (urlModeUserSelected) {
      setUrlModePendingParam(normalizedParam);
      if (normalizedParam !== targetParam) {
        return;
      }
      handledParam.current = normalizedParam;
      setUrlModePrevious(mode);
      setUrlModeOverride(null);
      dismissModeNotice();
      setAppliedMode(null);
      setPreviousMode(null);
      setVisible(false);
      setUrlModeUserSelected(false);
      setUrlModePendingParam(null);
      return;
    }

    const alreadyHandled = normalizedParam && handledParam.current === normalizedParam && urlModeOverride === mappedMode;
    if (alreadyHandled) {
      return;
    }

    handledParam.current = normalizedParam;

    // If the URL discipline already matches our current mode (and no override is active),
    // skip re-applying to avoid loops when we write d= ourselves.
    if (mappedMode === mode && !urlModeOverride) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[app-mode] skip apply, matches current', { normalizedParam, mappedMode, mode });
      }
      if (urlModePendingParam === normalizedParam) {
        setUrlModeUserSelected(false);
        setUrlModePendingParam(null);
      }
      setUrlModePrevious(mode);
      setUrlModeOverride(null);
      dismissModeNotice();
      setAppliedMode(null);
      setPreviousMode(null);
      setVisible(false);
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[app-mode] applying URL override', { normalizedParam, mappedMode, mode, urlModePrevious, urlModeOverride });
    }

    if (router.query?.d !== normalizedParam) {
      void syncUrlDisciplineParam(router, mappedMode);
    }

    const baselineMode = urlModePrevious ?? (mode !== mappedMode ? mode : AppMode.GENERAL);
    if (!urlModePrevious) {
      setUrlModePrevious(baselineMode);
    }
    setPreviousMode((prev) => prev ?? baselineMode);
    setUrlModeOverride(mappedMode);
    setAppliedMode(mappedMode);

    // Apply the mapped mode even if it matches current (SSR may have already set it),
    // but still show the notice to alert the user.
    if (mappedMode !== mode) {
      setMode(mappedMode);
    }
    // Only surface the notice if the incoming mode differs from current.
    if (mappedMode !== mode && !urlModeUserSelected && !urlModePendingParam) {
      showModeNotice();
      setVisible(true);
    }
  }, [
    router.isReady,
    router.query?.d,
    mode,
    setMode,
    showModeNotice,
    setUrlModePrevious,
    urlModePrevious,
    router,
    setUrlModeOverride,
    urlModeOverride,
    urlModeUserSelected,
    setUrlModeUserSelected,
    urlModePendingParam,
    setUrlModePendingParam,
  ]);

  useEffect(() => {
    if (!modeNoticeVisible) {
      handledParam.current = null;
      setVisible(false);
    }
  }, [modeNoticeVisible]);

  useEffect(() => {
    const sync = async () => {
      if (!router.isReady) {
        return;
      }
      if (router.query?.d !== undefined) {
        return; // URL already carries a discipline; avoid rewriting it here.
      }
      if (urlModeOverride) {
        return; // honor active URL override; avoid feedback loop while override is present
      }
      const currentParam = normalizeDisciplineParam(router.query?.d);
      const targetParam = appModeToDisciplineParam(mode);
      if (currentParam === targetParam) {
        return;
      }
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[app-mode] syncing URL param', { currentParam, targetParam, mode });
      }
      await syncUrlDisciplineParam(router, mode);
    };
    void sync();
  }, [router, mode, urlModeOverride]);

  const shouldRender = !!appliedMode && !!previousMode && (visible || modeNoticeVisible);
  if (!shouldRender) {
    return null;
  }

  const handleKeep = () => setVisible(false);

  const handleSwitchBack = () => {
    const targetMode = previousMode ?? urlModePrevious ?? null;
    if (targetMode && targetMode !== mode) {
      setMode(targetMode);
    }
    setVisible(false);
    dismissModeNotice();
    setUrlModeOverride(null);
    setUrlModePrevious(targetMode);
    setUrlModeUserSelected(true);
    setUrlModePendingParam(appModeToDisciplineParam(targetMode));
    void syncUrlDisciplineParam(router, targetMode);
  };

  return (
    <Alert
      status="info"
      variant="subtle"
      alignItems="center"
      borderRadius="md"
      color="gray.50"
      bg="blue.800"
      px={3}
      py={2}
      width="auto"
      maxW="420px"
      flex="0 0 auto"
      animation={`${pulse} 600ms ease-out`}
      style={{ animationDelay: '2s' }}
      data-testid="app-mode-url-notice"
    >
      <AlertIcon color="blue.100" />
      <Box>
        <AlertDescription fontSize="sm">Changed to {getAppModeLabel(appliedMode)}.</AlertDescription>
      </Box>
      <HStack spacing={2} ml={3}>
        <Button
          size="xs"
          colorScheme="blue"
          variant="solid"
          onClick={handleSwitchBack}
          data-testid="app-mode-url-notice-switch-back"
        >
          Switch back?
        </Button>
        <CloseButton size="sm" onClick={handleKeep} color="gray.50" />
      </HStack>
    </Alert>
  );
};
