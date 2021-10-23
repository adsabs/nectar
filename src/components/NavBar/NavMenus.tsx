import { MenuIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import { ReactElement, useState, KeyboardEvent, useEffect } from 'react';
import { AboutDropdown } from './AboutDropdown';
import { OrcidDropdown } from './OrcidDropdown';
import styles from './NavBar.module.css';
import Link from 'next/link';
import { ListType } from '@components/Dropdown/types';
import { useViewport, Viewport } from '@hooks';

export const NavMenus = (): ReactElement => {
  const [menuVisible, setMenuVisible] = useState<boolean>(false);

  const [menuReset, setMenuReset] = useState<boolean>(true);

  // reset all the sub menus (collapse) when main menu is closed
  // for mobile menu only
  useEffect(() => {
    menuVisible ? setMenuReset(false) : setMenuReset(true);
  }, [menuVisible]);

  const viewport = useViewport();

  const handleMenuToggle = () => {
    setMenuVisible(!menuVisible);
  };

  const handleSelected = () => {
    setMenuVisible(false);
  };

  const handleMenuKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case 'Space':
      case ' ':
        e.preventDefault();
        handleMenuToggle();
        return;
      case 'Escape':
        return close();
      case 'ArrowDown':
        e.preventDefault();
        return open();
    }
  };

  const open = () => {
    setMenuVisible(true);
  };

  const close = () => {
    setMenuVisible(false);
  };

  return (
    <>
      <div className="flex flex-grow items-center justify-end mr-2 md:invisible">
        <button onKeyDown={handleMenuKeyDown} aria-label="Menu">
          <MenuIcon
            className={clsx(menuVisible ? 'text-white' : styles['navbar-text-color'], 'm-1 w-8 h-8')}
            onClick={handleMenuToggle}
          />
        </button>
      </div>
      <div
        className={clsx(
          viewport < Viewport.MD && !menuVisible ? 'hidden' : '',
          styles['navbar-bg-color'],
          'md:initial absolute z-20 right-0 top-full flex flex-col flex-grow justify-end p-5 w-80 space-x-4 md:static md:flex-row md:items-center md:p-0 md:pr-4 md:w-max',
        )}
      >
        <OrcidDropdown
          type={viewport === Viewport.XS || viewport === Viewport.SM ? ListType.MENU : ListType.DROPDOWN}
          onFinished={handleSelected}
          reset={menuReset}
        />
        <AboutDropdown
          type={viewport === Viewport.XS || viewport === Viewport.SM ? ListType.MENU : ListType.DROPDOWN}
          onFinished={handleSelected}
          reset={menuReset}
        />
        <Link href="/user/account/register">
          <button
            className={clsx(
              styles['navbar-text-color'],
              styles['navbar-bg-color'],
              'flex items-center justify-start py-4 hover:text-white focus:text-white md:py-0',
            )}
            onClick={handleSelected}
          >
            Sign Up
          </button>
        </Link>
        <Link href="/login">
          <button
            className={clsx(
              styles['navbar-text-color'],
              styles['navbar-bg-color'],
              'flex items-center justify-start py-4 hover:text-white focus:text-white md:py-0',
            )}
            onClick={handleSelected}
          >
            Login
          </button>
        </Link>
      </div>
    </>
  );
};
