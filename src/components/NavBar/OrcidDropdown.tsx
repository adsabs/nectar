import { ListType } from './types';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';

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
    console.log('orcid sign in ');
  };

  return <MenuDropdown id="orcid" type={type} label="Orcid" items={items} onSelect={handleSelect} />;
};
