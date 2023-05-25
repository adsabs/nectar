import { HStack } from '@chakra-ui/layout';
import { OrcidInactiveLogo } from '@components';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { ListType } from './types';
import { useOrcid } from '@lib/orcid/useOrcid';
import { FormControl, FormLabel, Switch } from '@chakra-ui/react';

const items = [
  {
    id: 'login',
    label: 'Sign into Orcid to claim papers in ADS',
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
];

interface IOrcidDropdownProps {
  type: ListType;
  onFinished?: () => void;
}

export const OrcidDropdown = (props: IOrcidDropdownProps): ReactElement => {
  const { type, onFinished } = props;
  const { active, login, isAuthenticated, toggleOrcidMode } = useOrcid();

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (id === 'login') {
      login();
    }
    if (id === 'toggle-mode-active' || id === 'toggle-mode-inactive') {
      toggleOrcidMode();
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
        items={isAuthenticated ? [items[1]] : [items[0]]}
        onSelect={handleSelect}
      />
    );
  } else {
    return (
      <MenuDropdown
        id="orcid"
        type={type}
        label={orcidLabel}
        items={isAuthenticated ? [items[2]] : [items[0]]}
        onSelect={handleSelect}
      />
    );
  }
};
