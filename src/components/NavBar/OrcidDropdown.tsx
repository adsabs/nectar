import { MouseEventHandler, ReactElement } from 'react';
import { ListType } from './types';
import { MenuDropdown } from '@components/NavBar/MenuDropdown';
import { useOrcid } from '@lib/orcid/useOrcid';
import { isBrowser } from '@utils';
import { OrcidInactiveLogo, OrcidLogo } from '@components';
import { Flex, HStack, Switch, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { AppState, useStore } from '@store';

interface IOrcidDropdownProps {
  type: ListType;
  onFinished?: () => void;
}

export const OrcidDropdown = ({ onFinished }: IOrcidDropdownProps): ReactElement => {
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

  const items = isAuthenticated
    ? [
        // on the orcid home page route, we don't want to show the toggle
        ...(router.pathname === '/user/orcid'
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
            ]),
        {
          id: 'logout',
          label: <OrcidLogout />,
          menuItemProps: {
            _focus: {
              backgroundColor: 'red.600',
            },
            backgroundColor: 'red.400',
          },
        },
      ]
    : [
        {
          id: 'login',
          label: <OrcidLogin />,
        },
      ];

  return (
    <MenuDropdown id="orcid" type={ListType.DROPDOWN} label={<OrcidLabel />} items={items} onSelect={handleSelect} />
  );
};

const orcidActiveSelector = (state: AppState) => state.orcid.active;
const OrcidLabel = (): ReactElement => {
  const active = useStore(orcidActiveSelector);

  return (
    <HStack spacing={1} mr={-2}>
      {isBrowser() && active ? (
        <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
      ) : (
        <OrcidInactiveLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
      )}
      <Text>ORCiD</Text>
    </HStack>
  );
};

const OrcidToggle = () => {
  const active = useStore(orcidActiveSelector);

  return (
    <Flex w="full" justifyContent="space-between">
      <Text>Toggle ORCiD mode</Text>
      <Switch isChecked={active} />
    </Flex>
  );
};

const OrcidLogin = () => {
  const { login } = useOrcid();

  return <Text onClick={login}>Sign into ORCiD to claim papers in ADS</Text>;
};

const OrcidLogout = () => {
  const { logout } = useOrcid();

  return (
    <Text color="white" onClick={logout}>
      Logout from ORCiD
    </Text>
  );
};
