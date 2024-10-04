import { useRouter } from 'next/router';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { DividerItem, ItemItem, ItemType, ListType } from './types';
import { useSession } from '@/lib/useSession';
import { Flex, HStack, Icon, Text } from '@chakra-ui/react';
import { UserIcon } from '@heroicons/react/24/solid';
import { useGetUserEmail } from '@/lib/useGetUserEmail';
import { isBrowser } from '@/utils/common/guards';

export const items: ItemType[] = [
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

const loggedInItems: ItemType[] = [
  { id: 'libraries', path: '/user/libraries', label: 'SciX Libraries' },
  { id: 'notifications', path: '/user/notifications', label: 'Email Notifications' },
  { id: 'settings', path: '/user/settings', label: 'Settings' },
  'divider',
  { id: 'logout', path: null, label: 'Logout' },
];

interface IAccountDropdown {
  type: ListType;
  onFinished?: () => void;
}

export const AccountDropdown = (props: IAccountDropdown): ReactElement => {
  const { type, onFinished } = props;
  const { isAuthenticated, logout } = useSession();
  const username = useGetUserEmail();

  const router = useRouter();
  const itemsToShow = isAuthenticated
    ? [
        {
          id: 'user',
          label: (
            <Flex direction="column" my={2}>
              <Text>Signed in as</Text>
              <Text fontWeight="bold">{username}</Text>
            </Flex>
          ),
          static: true,
        },
        'divider' as DividerItem,
        ...loggedInItems,
      ]
    : items;

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      if (id === 'logout') {
        logout();
      } else {
        const item = itemsToShow.find((item) => item !== 'divider' && id === (item as ItemItem).id);
        void router.push(item ? (item as ItemItem).path : '/');
      }

      if (typeof onFinished === 'function') {
        onFinished();
      }
    }
  };

  return (
    <MenuDropdown
      id="account"
      type={type}
      label={
        <HStack spacing={1} mr={-2}>
          <Icon as={UserIcon} color={isAuthenticated ? 'blue.400' : 'gray.50'} aria-hidden />
          <Text>Account</Text>
        </HStack>
      }
      items={itemsToShow}
      onSelect={handleSelect}
    />
  );
};
