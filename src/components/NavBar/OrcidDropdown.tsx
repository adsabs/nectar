import { HStack } from '@chakra-ui/layout';
import { OrcidInactiveLogo } from '@components';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { ListType } from './types';

const items = [
  {
    id: 'login',
    label: 'Sign into Orcid to claim papers in ADS',
  },
];

interface IOrcidDropdownProps {
  type: ListType;
  onFinished?: () => void;
}

export const OrcidDropdown = (props: IOrcidDropdownProps): ReactElement => {
  const { type, onFinished } = props;

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (id === 'login') {
      handleOrcidSignIn();
    }
    if (onFinished) {
      onFinished();
    }
  };

  const handleOrcidSignIn = () => {
    // console.log('orcid sign in ');
  };

  const orcidLabel = (
    <HStack spacing={1}>
      <OrcidInactiveLogo className="flex-shrink-0 w-4 h-4" aria-hidden />
      <span>ORCiD</span>
    </HStack>
  );

  return <MenuDropdown id="orcid" type={type} label={orcidLabel} items={items} onSelect={handleSelect} />;
};
