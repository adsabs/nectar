import Image from 'next/image';
import { ListType } from '@components/Dropdown/types';
import clsx from 'clsx';
import React, { ReactElement } from 'react';
import { CollapsibleList, DropdownList } from '../Dropdown';
import styles from './NavBar.module.css';
import { ChevronDownIcon } from '@heroicons/react/solid';

interface IOrcidDropdownProps {
  type: ListType;
  reset: boolean;
  onFinished: () => void;
}

const items = [
  {
    id: 'login',
    domId: 'orcid-login',
    label: 'Sign into Orcid to claim papers in ADS',
  },
];

export const OrcidDropdown = (props: IOrcidDropdownProps): ReactElement => {
  const { type, reset, onFinished } = props;

  const handleSelect = (id: string) => {
    if (id === 'login') {
      handleOrcidSignIn();
      onFinished();
    }
  };

  const handleOnClose = () => {
    onFinished();
  }

  const handleOrcidSignIn = () => {
    console.log('orcid sign in ');
  };

  const getOrcidLabelNode = () => {
    return (        
      <div>
        <Image
          src="/img/orcid_inactive.svg"
          width="18"
          height="18"
          alt="ORCID logo inactive"
          className="flex-shrink-0 m-auto"
        />
        <span> ORCiD</span>
        <ChevronDownIcon className="inline w-4 h-4" />
      </div>
    );
  };

  return type === ListType.DROPDOWN ? (
    <DropdownList
      label={getOrcidLabelNode()}
      items={items}
      onSelect={handleSelect}
      classes={{
        button: 'text-gray-300 hover:text-white focus:text-white',
        list: ''
      }}
      offset={[-60, 12]}
      useCustomLabel={true}
      role="menu"
    />
  ) : (
    <CollapsibleList
      label={getOrcidLabelNode()}
      useCustomLabel={true}
      items={items}
      onSelect={handleSelect}
      onClose={handleOnClose}
      classes={{
        button: clsx(
          styles['navbar-text-color'],
          styles['navbar-bg-color'],
          'py-4 text-left hover:text-white focus:text-white',
        ),
        item: clsx(styles['navbar-text-color'], 'hover:text-white focus:text-white'),
      }}
      role="menu"
      reset={reset}
    />
  );
};
