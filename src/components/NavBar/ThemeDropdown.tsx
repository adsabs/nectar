import { Box } from '@chakra-ui/layout';
import { Select, ThemeSelectorStyle } from '@components';
import { useStore } from '@store';
import { ReactElement, useMemo } from 'react';
import shallow from 'zustand/shallow';
import { themes } from './models';

const options = Object.values(themes);

export const ThemeDropdown = (): ReactElement => {
  const [theme, setTheme] = useStore((state) => [state.theme, state.setTheme], shallow);

  const option = useMemo(() => themes[theme], [theme]);

  return (
    <Box width={{ base: '200px', xs: '270px' }}>
      <Select value={option} options={options} styles={ThemeSelectorStyle} onChange={setTheme} />
    </Box>
  );
};
