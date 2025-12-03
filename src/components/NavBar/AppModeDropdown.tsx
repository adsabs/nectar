import { Box } from '@chakra-ui/react';

import { useStore } from '@/store';
import { AppMode } from '@/types';
import { ReactElement, useMemo } from 'react';
import shallow from 'zustand/shallow';
import { modes } from './models';
import { sendGTMEvent } from '@next/third-parties/google';
import { Select, SelectOption } from '@/components/Select';
import { appModeToDisciplineParam, syncUrlDisciplineParam } from '@/utils/appMode';
import { useRouter } from 'next/router';

const options = Object.values(modes);

export const AppModeDropdown = (): ReactElement => {
  const router = useRouter();
  const [
    mode,
    setMode,
    dismissModeNotice,
    setUrlModePrevious,
    setUrlModeOverride,
    setUrlModeUserSelected,
    setUrlModePendingParam,
  ]: [
    AppMode,
    (mode: AppMode) => void,
    () => void,
    (mode: AppMode | null) => void,
    (mode: AppMode | null) => void,
    (selected: boolean) => void,
    (param: string | null) => void,
  ] = useStore(
    (state) => [
      state.mode,
      state.setMode,
      state.dismissModeNotice,
      state.setUrlModePrevious,
      state.setUrlModeOverride,
      state.setUrlModeUserSelected,
      state.setUrlModePendingParam,
    ],
    shallow,
  );

  const option = useMemo(() => modes[mode], [mode]);

  const handleThemeChange = ({ id: nextMode }: SelectOption<AppMode>) => {
    setUrlModeUserSelected(true);
    setUrlModePendingParam(appModeToDisciplineParam(nextMode));
    setUrlModePrevious(nextMode); // user-chosen mode becomes the new baseline
    setUrlModeOverride(null);
    dismissModeNotice();
    setMode(nextMode);
    void syncUrlDisciplineParam(router, nextMode);
    sendGTMEvent({
      event: 'app_mode_change',
      mode: nextMode,
    });
  };

  return (
    <Box width={{ base: '200px', xs: '270px' }}>
      <Select<SelectOption<AppMode>>
        value={option}
        options={options}
        stylesTheme="theme"
        onChange={handleThemeChange}
        label="Select theme"
        id="theme-selector"
        instanceId="theme-selector"
      />
    </Box>
  );
};
