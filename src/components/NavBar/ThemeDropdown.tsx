import { Box } from '@chakra-ui/layout';
import { Select, ThemeSelectorStyle } from '@components';
import { useStore } from '@store';
import { Theme } from '@types';
import { ReactElement, useMemo } from 'react';
import shallow from 'zustand/shallow';
import { themes } from './models';

const options = Object.values(themes);

export const ThemeDropdown = (): ReactElement => {
  const [theme, setTheme]: [Theme, (theme: Theme) => void] = useStore(
    (state) => [state.theme, state.setTheme],
    shallow,
  );

  const option = useMemo(() => themes[theme], [theme]);

  const handleThemeChange = (theme: string) => setTheme(theme as Theme);

  return (
    <Box width={{ base: '200px', xs: '270px' }}>
      <Select
        value={option}
        options={options}
        styles={ThemeSelectorStyle}
        onChange={handleThemeChange}
        ariaLabel="Select theme"
      />
    </Box>
  );
};
