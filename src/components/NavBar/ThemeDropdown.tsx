import { AppEvent, useAppCtx } from '@store';
import { Theme } from '@types';
import { ReactElement, useEffect, useState } from 'react';
import Select, { ControlProps, OptionProps, StylesConfig } from 'react-select';
import { CSSObject } from '@emotion/react';
import { useViewport, Viewport } from '@hooks';

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

  const customStyles: StylesConfig<ThemeOption> = {
    control: (provided: CSSObject, state: ControlProps<ThemeOption>) => ({
      ...provided,
      height: '2em',
      borderRadius: '2px',
      borderColor: 'var(--chakra-colors-gray-100)',
      backgroundColor: 'var(--chakra-colors-gray-900)',
      width: viewport < Viewport.XS ? '200px' : '270px',
      outline: 'none',
      boxShadow: state.isFocused ? 'var(--chakra-shadows-outline)' : 'none',
    }),
    indicatorSeparator: () => ({
      isDisabled: true,
    }),
    singleValue: (provided: CSSObject) => ({
      ...provided,
      color: 'var(--chakra-colors-gray-100)',
    }),
    container: (provided: CSSObject) => ({
      ...provided,
      zIndex: 10,
    }),
    option: (provided: CSSObject, state: OptionProps) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'var(--chakra-colors-gray-100)' : 'transparent',
      color: 'var(--chakra-colors-gray-700)',
    }),
  };

  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(themes[0]);

  useEffect(() => {
    setSelectedTheme(themes.find((theme) => theme.id === appState.theme));
  }, [appState.theme]);

  const handleOnSelect = (selected: ThemeOption) => {
    dispatch({ type: AppEvent.SET_THEME, payload: selected.id });
  };

  return (
    <Select
      value={selectedTheme}
      options={themes}
      isSearchable={false}
      styles={customStyles}
      onChange={handleOnSelect}
    />
  );
};
