import { AppEvent, useAppCtx } from '@store';
import { Theme } from '@types';
import { ReactElement, useEffect, useState } from 'react';
import { useViewport, Viewport } from '@hooks';
import { Select, ThemeSelectorStyle } from '@components';
import { Box } from '@chakra-ui/layout';

type ThemeOption = {
  id: Theme;
  value: string;
  label: string;
};

const themes: ThemeOption[] = [
  {
    id: Theme.GENERAL,
    value: 'general',
    label: 'General Science',
  },
  {
    id: Theme.ASTROPHYSICS,
    value: 'astrophysics',
    label: 'Astrophysics',
  },
  {
    id: Theme.HELIOPHYISCS,
    value: 'heliophysics',
    label: 'Heliophysics',
  },
  {
    id: Theme.PLANET_SCIENCE,
    value: 'planetary',
    label: 'Planetary Science',
  },
  {
    id: Theme.EARTH_SCIENCE,
    value: 'earth',
    label: 'Earth Science',
  },
  {
    id: Theme.BIO_PHYSICAL,
    value: 'biophysical',
    label: 'Biological & Physical Science',
  },
];

export const ThemeDropdown = (): ReactElement => {
  const { state: appState, dispatch } = useAppCtx();

  const viewport = useViewport();

  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(themes[0]);

  useEffect(() => {
    setSelectedTheme(themes.find((theme) => theme.id === appState.theme));
  }, [appState.theme]);

  const handleOnSelect = (selected: Theme) => {
    dispatch({ type: AppEvent.SET_THEME, payload: selected });
  };

  return (
    <Box width={viewport < Viewport.XS ? '200px' : '270px'}>
      <Select value={selectedTheme} options={themes} styles={ThemeSelectorStyle} onChange={handleOnSelect} />
    </Box>
  );
};
