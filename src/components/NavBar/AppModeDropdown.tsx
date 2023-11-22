import { Box } from '@chakra-ui/react';
import { Select, SelectOption } from '@components';
import { useStore } from '@store';
import { AppMode } from '@types';
import { ReactElement, useMemo } from 'react';
import shallow from 'zustand/shallow';
import { modes } from './models';
import { useGTMDispatch } from '@elgorditosalsero/react-gtm-hook';

const options = Object.values(modes);

export const AppModeDropdown = (): ReactElement => {
  const sendDataToGTM = useGTMDispatch();
  const [mode, setMode]: [AppMode, (mode: AppMode) => void] = useStore((state) => [state.mode, state.setMode], shallow);

  const option = useMemo(() => modes[mode], [mode]);

  const handleThemeChange = ({ id: mode }: SelectOption<AppMode>) => {
    setMode(mode);
    sendDataToGTM({
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
