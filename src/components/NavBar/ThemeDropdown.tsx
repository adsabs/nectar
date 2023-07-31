import { Box } from '@chakra-ui/react';
import { Select, SelectOption } from '@components';
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

  return (
    <Box width={{ base: '200px', xs: '270px' }}>
      <Select<SelectOption<Theme>>
        value={option}
        options={options}
        stylesTheme="theme"
        onChange={({ id: theme }) => setTheme(theme)}
        label="Select theme"
        id="theme-selector"
        instanceId="theme-selector"
      />
    </Box>
  );
};
