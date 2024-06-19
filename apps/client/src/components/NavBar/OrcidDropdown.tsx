import { MouseEventHandler, ReactElement } from 'react';
import { ItemType, ListType } from './types';
import { MenuDropdown } from '@/components/NavBar/MenuDropdown';
import { useOrcid } from '@/lib/orcid/useOrcid';
import { isBrowser } from '@/utils';
import { OrcidInactiveLogo, OrcidLogo } from '@/components';
import { Flex, HStack, Icon, Switch, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { AppState, useStore } from '@/store';

interface IOrcidDropdownProps {
  type: ListType;
  onFinished?: () => void;
}

export const OrcidDropdown = ({ type, onFinished }: IOrcidDropdownProps): ReactElement => {
  const { toggleOrcidMode, login, logout, isAuthenticated } = useOrcid();
  const router = useRouter();
  const handleSelect: MouseEventHandler<HTMLButtonElement> = (e) => {
    onFinished?.();
    const id = e.currentTarget.dataset['id'];
    switch (id) {
      case 'toggle-orcid':
        return toggleOrcidMode();
      case 'my-orcid-page':
        return void router.replace('/user/orcid');
      case 'login':
        return login();
      case 'logout':
        return logout();
    }
  };

  const items: ItemType[] = isAuthenticated
    ? [
        // on the orcid home page route, we don't want to show the toggle
        ...((router.pathname === '/user/orcid'
          ? []
          : [
              {
                id: 'toggle-orcid',
                label: <OrcidToggle />,
              },
              {
                id: 'my-orcid-page',
                label: 'My ORCiD Page',
              },
              'divider',
            ]) as ItemType[]),
        {
          id: 'logout',
          label: <OrcidLogout />,
        },
      ]
    : [
        {
          id: 'login',
          label: <OrcidLogin />,
        },
      ];

  return <MenuDropdown id="orcid" type={type} label={<OrcidLabel />} items={items} onSelect={handleSelect} />;
};

const orcidActiveSelector = (state: AppState) => state.orcid.active;
const OrcidLabel = (): ReactElement => {
  const active = useStore(orcidActiveSelector);

  return (
    <HStack spacing={1} mr={-2}>
      {isBrowser() && active ? (
        <Icon as={OrcidLogo} boxSize="4" aria-hidden />
      ) : (
        <Icon as={OrcidInactiveLogo} boxSize="4" aria-hidden />
      )}
      <Text>ORCiD</Text>
    </HStack>
  );
};

const OrcidToggle = () => {
  const active = useStore(orcidActiveSelector);

  return (
    <Flex w="full" justifyContent="space-between" style={{ pointerEvents: 'none' }}>
      <Text>{active ? 'Turn off' : 'Turn on'} ORCiD mode</Text>
      <Switch isChecked={active} isFocusable={false} isReadOnly aria-hidden />
    </Flex>
  );
};

const OrcidLogin = () => {
  const { login } = useOrcid();

  return <Text onClick={login}>Sign into ORCiD to claim papers in ADS</Text>;
};

const OrcidLogout = () => {
  const { logout } = useOrcid();

  return <Text onClick={logout}>Logout from ORCiD</Text>;
};
