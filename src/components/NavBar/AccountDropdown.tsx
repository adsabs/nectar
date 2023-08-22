import { isBrowser } from '@utils';
import { useRouter } from 'next/router';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { ListType } from './types';
import { useSession } from '@lib/useSession';

export const items = [
  {
    id: 'login',
    path: '/user/account/login',
    label: 'Login',
  },
  {
    id: 'signup',
    path: '/user/account/register',
    label: 'Signup',
  },
];

const loggedInItems = [
  { id: 'libraries', path: '/user/libraries', label: 'SciX Libraries' },
  { id: 'settings', path: '/user/settings', label: 'Settings' },
  { id: 'logout', path: null, label: 'Logout' },
];

interface IAccountDropdown {
  type: ListType;
  onFinished?: () => void;
}

export const AccountDropdown = (props: IAccountDropdown): ReactElement => {
  const { type, onFinished } = props;
  const { isAuthenticated, logout } = useSession();

  const router = useRouter();
  const itemsToShow = isAuthenticated ? loggedInItems : items;

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      if (id === 'logout') {
        logout();
      } else {
        const item = itemsToShow.find((item) => id === item.id);
        void router.push(item ? item.path : '/');
      }

      if (typeof onFinished === 'function') {
        onFinished();
      }
    }
  };

  return <MenuDropdown id="account" type={type} label="Account" items={itemsToShow} onSelect={handleSelect} />;
};
