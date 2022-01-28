import { DropdownList, SelectorLabel } from '@components/Dropdown';
import { useStore } from '@store';
import clsx from 'clsx';
import { ReactElement, useMemo } from 'react';
import { themes } from './models';
import styles from './NavBar.module.css';

export const ThemeDropdown = (): ReactElement => {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);

  const selectorClasses = clsx(
    styles['navbar-bg-color'],
    styles['navbar-text-color'],
    'flex items-center justify-between w-64 border border-gray-50 border-opacity-50 rounded-sm cursor-pointer',
  );

  const labelNode = useMemo(
    () => <SelectorLabel text={themes[theme].label as string} classes={selectorClasses} />,
    [theme],
  );

  return (
    <DropdownList
      label={labelNode}
      items={Object.values(themes)}
      onSelect={setTheme}
      classes={{
        button: '',
        list: 'w-64',
      }}
      offset={[0, 4]}
      placement="bottom-start"
      role={{ label: 'list', item: 'listitem' }}
      ariaLabel="Theme selector"
    />
  );
};
