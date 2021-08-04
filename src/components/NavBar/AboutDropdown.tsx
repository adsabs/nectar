import React, { ReactElement } from 'react';
import { DropdownList } from '../Dropdown';

const items = [
  {
    id: 'about',
    domId: 'about-about',
    path: '/about',
    label: 'About ADS'
  },
  {
    id: 'new',
    domId: 'about-new',
    path: '/help/whats_new',
    label: 'What\'s New'
  },
  { 
    id: 'blog',
    domId: 'about-blog',
    path: '/blog',
    label: 'ADS Blog'
  },
  {
    id: 'help',
    domId: 'about-help',
    path: '/help/',
    label: 'ADS Help Pages'
  },
  {
    id: 'legacy',
    domId: 'about-legacy',
    path: '/help/legacy',
    label: 'ADS Legacy Services'
  },
  {
    id: 'careers',
    domId: 'about-careers',
    path: '/about/careers',
    label: 'Careers@ADS'
  }
]

export const AboutDropdown = (): ReactElement => {

  const handleSelect = (id: string) => {
    if (typeof window !== 'undefined')
      window.open(items.find((item) => id === item.id).path, '_blank', 'noopener,noreferrer')
  };

  return (
    <DropdownList
      label="About"
      items={items}
      onSelect={handleSelect}
      classes={{
        button: 'text-gray-300 hover:text-white focus:text-white',
      }}
      offset={[-60, 12]}
      useCustomLabel={false}
      role='menu'
    />
  );
};
