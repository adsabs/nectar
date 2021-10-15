import { CheckIcon, ChevronDownIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import React from 'react';
import styles from './Dropdown.module.css';

/** Non JavaScript dropdown */
export interface ISimpleLinkDropdownItem {
  id: string;
  path: string;
  domId: string;
  label: string;
}

export interface ISimpleLinkDropdownProps {
  items: ISimpleLinkDropdownItem[];
  selected: string;
  label: string;
}

export const SimpleLinkDropdown = (props: ISimpleLinkDropdownProps): React.ReactElement => {
  const { items, selected, label } = props;

  return (
    <div className={styles['simple-dropdown']}>
      <button className="button-simple" role="list">
        {label} <ChevronDownIcon className="inline w-4 h-4" />
      </button>
      <div className={styles['simple-dropdown-content']}>
        {items.map((item) => (
          <Link key={item.id} href={item.path}>
            <a
              tabIndex={0}
              className={styles['simple-dropdown-link']}
              role="listitem"
              aria-selected={selected === item.id}
            >
              {item.label} {selected === item.id ? <CheckIcon className="inline w-4 h-4" /> : null}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
};
