import { CheckIcon, ChevronDownIcon } from '@heroicons/react/outline';
import clsx from 'clsx';
import Link from 'next/link';
import { Fragment, ReactElement } from 'react';
import styles from './Dropdown.module.css';
import { ItemType } from './types';

/** Non JavaScript dropdown */
export interface ISimpleLinkDropdownProps {
  items: ItemType[];
  selected?: string;
  label: string | ReactElement;
  classes?: {
    label?: string;
    list?: string;
    item?: string;
  };
  role: {
    label: string;
    item: string;
  };
}

export const SimpleLinkDropdown = (props: ISimpleLinkDropdownProps): ReactElement => {
  const { items, selected, label, classes, role, ...restProps } = props;

  const labelClasses = classes && classes.label ? clsx(classes.label) : 'button-simple';

  const listClasses =
    classes && classes.list ? clsx(styles['simple-dropdown-content'], classes.list) : styles['simple-dropdown-content'];

  const itemClasses =
    classes && classes.item ? clsx(styles['simple-dropdown-link'], classes.item) : styles['simple-dropdown-link'];

  return (
    <div className={styles['simple-dropdown']} {...restProps} role={role.label}>
      {typeof label === 'string' ? (
        <button className={labelClasses}>
          {label} <ChevronDownIcon className="inline w-4 h-4" aria-hidden="true" />
        </button>
      ) : (
        <>{label}</>
      )}
      <div className={listClasses}>
        {items.map((item) => (
          <Fragment key={item.id}>
            {item.disabled ? (
              <div className="p-2 text-gray-400 cursor-default">
                {item.label} {selected === item.id ? <CheckIcon className="inline w-4 h-4" /> : null}
              </div>
            ) : (
              <Link key={item.id} href={item.path}>
                <a
                  className={itemClasses}
                  role={role.item}
                  aria-selected={selected === item.id}
                  rel="noreferrer noopener"
                  target={item.newTab ? '_blank' : '_self'}
                >
                  {item.label}{' '}
                  {selected === item.id ? <CheckIcon className="inline w-4 h-4" aria-hidden="true" /> : null}
                </a>
              </Link>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};
