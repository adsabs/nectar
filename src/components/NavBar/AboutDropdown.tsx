import { ListType } from '@components/Dropdown/types';
import clsx from 'clsx';
import React, { ReactElement } from 'react';
import { DropdownList, CollapsibleList } from '../Dropdown';
import styles from './NavBar.module.css';

const items = [
  {
    id: 'about',
    domId: 'about-about',
    path: '/about',
    label: 'About ADS',
  },
  {
    id: 'new',
    domId: 'about-new',
    path: '/help/whats_new',
    label: "What's New",
  },
  {
    id: 'blog',
    domId: 'about-blog',
    path: '/blog',
    label: 'ADS Blog',
  },
  {
    id: 'help',
    domId: 'about-help',
    path: '/help/',
    label: 'ADS Help Pages',
  },
  {
    id: 'legacy',
    domId: 'about-legacy',
    path: '/help/legacy',
    label: 'ADS Legacy Services',
  },
  {
    id: 'careers',
    domId: 'about-careers',
    path: '/about/careers',
    label: 'Careers@ADS',
  },
];

interface IAboutDropdownProps {
  type: ListType;
  reset: boolean;
  onFinished: () => void;
}

export const AboutDropdown = (props: IAboutDropdownProps): ReactElement => {
  const { type, reset, onFinished } = props;

  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined')
      window.open(items.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer');

    onFinished();
  };

  const handleOnClose = () => {
    onFinished();
  }

  return type === ListType.DROPDOWN ? (
    <DropdownList
      label="About"
      items={items}
      onSelect={handleSelect}
      classes={{
        button: 'text-gray-300 hover:text-white focus:text-white',
        list: ''
      }}
      offset={[-60, 12]}
      useCustomLabel={false}
      role="menu"
      placement="bottom-start"
    />
  ) : (
    <CollapsibleList
      label="About"
      useCustomLabel={false}
      items={items}
      onSelect={handleSelect}
      onClose={handleOnClose}
      classes={{
        button: clsx(styles['navbar-text-color'], styles['navbar-bg-color'], 'hover:text-white text-left focus:text-white py-4'),
        item: clsx(styles['navbar-text-color'], 'hover:text-white focus:text-white')
      }}
      role="menu"
      reset={reset}
    />
  );
};
