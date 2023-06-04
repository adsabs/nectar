import { HStack } from '@chakra-ui/layout';
import { MouseEvent, ReactElement } from 'react';
import { ListType } from './types';
import { useOrcid } from '@lib/orcid/useOrcid';
import { useRouter } from 'next/router';
import { MenuDropdown } from '@components/NavBar/MenuDropdown';
import { OrcidInactiveLogo, OrcidLogo } from '@components';
import { isBrowser } from '@utils';

const items = [
  {
    id: 'login',
    label: 'Sign into ORCiD to claim papers in ADS',
  },
  {
    id: 'orcid-toggle',
    label: 'Toggle ORCiD mode',
  },
  {
    id: 'my-orcid-page',
    label: 'My ORCiD Page',
  },
  {
    id: 'logout',
    label: 'Logout from ORCiD',
  },
];


interface IOrcidDropdownProps {
  type: ListType;
  onFinished?: () => void;
}

export const OrcidDropdown = (props: IOrcidDropdownProps): ReactElement => {
  const router = useRouter();
  const { type, onFinished } = props;
  const { active, login, logout, isAuthenticated, toggleOrcidMode } = useOrcid();

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (id === 'login') {
      login();
    }
    if (id === 'logout') {
      logout();
    }
    if (id === 'orcid-toggle') {
      toggleOrcidMode();
    }
    if (id === 'my-orcid-page') {
      void router.replace('/user/orcid');
    }
    if (onFinished) {
      onFinished();
    }
  };

  const orcidLabel = (
    <HStack spacing={1}>
      {isBrowser() && active ? (
        <OrcidLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
      ) : (
        <OrcidInactiveLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
      )}
      <span>ORCiD</span>
    </HStack>
  );

  if (active) {
    return (
      <MenuDropdown
        id="orcid"
        type={type}
        label={orcidLabel}
        items={isAuthenticated ? [items[1], items[2], items[3]] : [items[0]]}
        onSelect={handleSelect}
      />
    );
  } else {
    return (
      <MenuDropdown
        id="orcid"
        type={type}
        label={orcidLabel}
        items={isAuthenticated ? [items[1], items[2], items[3]] : [items[0]]}
        onSelect={handleSelect}
      />
    );
  }
};

