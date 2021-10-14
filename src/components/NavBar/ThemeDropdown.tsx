import { DropdownList, SelectorLabel } from '@components/Dropdown';
import { ItemType } from '@components/Dropdown/types';
import { AppEvent, useAppCtx } from '@store';
import { Theme } from '@types';
import clsx from 'clsx';
import { ReactElement, useEffect, useState } from 'react';
import styles from './NavBar.module.css';

const themes: ItemType[] = [
  {
    id: Theme.GENERAL,
    domId: 'theme-general',
    label: 'General Science',
  },
  {
    id: Theme.ASTROPHYSICS,
    domId: 'theme-astrophysics',
    label: 'Astrophysics',
  },
  {
    id: Theme.HELIOPHYISCS,
    domId: 'theme-heliophysics',
    label: 'Heliophysics',
  },
  {
    id: Theme.PLANET_SCIENCE,
    domId: 'theme-planetary',
    label: 'Planetary Science',
  },
  {
    id: Theme.EARTH_SCIENCE,
    domId: 'theme-earth',
    label: 'Earth Science',
  },
  {
    id: Theme.BIO_PHYSICAL,
    domId: 'theme-biophysical',
    label: 'Biological & Physical Science',
  },
];

export const ThemeDropdown = (): ReactElement => {
  const { state: appState, dispatch } = useAppCtx();

  const [selectedTheme, setSelectedTheme] = useState<string>(Theme.GENERAL);

  useEffect(() => {
    setSelectedTheme(appState.theme);
  }, [appState.theme]);

  const setUserTheme = (themeId: Theme) => {
    dispatch({ type: AppEvent.SET_THEME, payload: themeId });
    setSelectedTheme(themeId);
  };

  const selectorClasses = clsx(
    styles['navbar-bg-color'],
    styles['navbar-text-color'],
    'flex items-center justify-between w-64 border border-gray-50 border-opacity-50 rounded-sm cursor-pointer',
  );

  const getLabelNode = (itemId: string) => {
    const label = themes.find((item) => item.id === itemId).label as string;

    return <SelectorLabel text={label} classes={selectorClasses} />;
  };

  const handleOnSelect = (themeId: Theme) => {
    setUserTheme(themeId);
    setSelectedTheme(themes.find((theme) => theme.id === themeId).id);
  };

  return (
    <DropdownList
      label={getLabelNode(selectedTheme)}
      items={themes}
      onSelect={handleOnSelect}
      classes={{
        button: '',
        list: 'w-64',
      }}
      offset={[0, 4]}
      placement="bottom-start"
      role="listbox"
      ariaLabel="Theme selector"
    />
  );
};
