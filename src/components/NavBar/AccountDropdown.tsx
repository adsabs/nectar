import { ListType } from './types';
import { isBrowser } from '@utils';
import { ReactElement, MouseEvent } from 'react';
import { useRouter } from 'next/router';
import { MenuDropdown } from './MenuDropdown';

export const items = [
  {
    id: 'login',
    path: '/login',
    label: 'Login',
  },
  {
    id: 'signup',
    path: '/user/account/register',
    label: 'Signup',
  },
];

interface IAccountDropdown {
  type: ListType;
  onFinished?: () => void;
}

export const AccountDropdown = (props: IAccountDropdown): ReactElement => {
  const { type, onFinished } = props;

  const router = useRouter();

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      void router.push(items.find((item) => id === item.id).path);
      if (onFinished) {
        onFinished();
      }
    }
  };

  return <MenuDropdown id="account" type={type} label="Account" items={items} onSelect={handleSelect} />;
};
