import { HStack } from '@chakra-ui/layout';
import { OrcidInactiveLogo } from '@components';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { ListType } from './types';
import { useOrcid } from '@lib/orcid/useOrcid';
import { FormControl, FormLabel, Switch } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const items = [
  {
    id: 'login',
    label: 'Sign into ORCiD to claim papers in ADS',
  },
  {
    id: 'toggle-mode-active',
    label: (
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="orcid-mode" mb="0">
          ORCiD Mode Active
        </FormLabel>
        <Switch id="orcid-mode" checked />
      </FormControl>
    ),
  },
  {
    id: 'toggle-mode-inactive',
    label: (
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="orcid-mode" mb="0">
          ORCiD Mode Inactive
        </FormLabel>
        <Switch id="orcid-mode" checked={false} />
      </FormControl>
    ),
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
    if (id === 'toggle-mode-active' || id === 'toggle-mode-inactive') {
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
      <OrcidInactiveLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
      <span>ORCiD</span>
    </HStack>
  );

  if (active) {
    return (
      <MenuDropdown
        id="orcid"
        type={type}
        label={orcidLabel}
        items={isAuthenticated ? [items[1], items[3], items[4]] : [items[0]]}
        onSelect={handleSelect}
      />
    );
  } else {
    return (
      <MenuDropdown
        id="orcid"
        type={type}
        label={orcidLabel}
        items={isAuthenticated ? [items[2], items[3], items[4]] : [items[0]]}
        onSelect={handleSelect}
      />
    );
  }
};
