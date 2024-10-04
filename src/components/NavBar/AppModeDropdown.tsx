import { Box } from '@chakra-ui/react';

import { useStore } from '@/store';
import { AppMode } from '@/types';
import { ReactElement, useMemo } from 'react';
import shallow from 'zustand/shallow';
import { modes } from './models';
import { sendGTMEvent } from '@next/third-parties/google';
import { Select, SelectOption } from '@/components/Select';

const options = Object.values(modes);

export const AppModeDropdown = (): ReactElement => {
  const [mode, setMode]: [AppMode, (mode: AppMode) => void] = useStore((state) => [state.mode, state.setMode], shallow);

  const option = useMemo(() => modes[mode], [mode]);

  const handleThemeChange = ({ id: mode }: SelectOption<AppMode>) => {
    setMode(mode);
    sendGTMEvent({
      event: 'app_mode_change',
      mode,
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
