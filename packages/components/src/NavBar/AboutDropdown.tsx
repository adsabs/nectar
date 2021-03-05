import {
  faArchive,
  faBullhorn,
  faNewspaper,
  faQuestionCircle,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React, { FC, ReactElement } from 'react';
import { Dropdown, ItemType } from '../Dropdown';

interface IItemLinkProps {
  href: string;
}
const ItemLink: FC<IItemLinkProps> = (props): ReactElement => {
  const { href, children } = props;

  return (
    <Link href={href}>
      <a>
        <div className="text-gray-700 h-full w-full">{children}</div>
      </a>
    </Link>
  );
};

const items: ItemType[] = [
  {
    id: 'about',
    element: (
      <ItemLink href="/about">
        <FontAwesomeIcon icon={faQuestionCircle} /> About ADS
      </ItemLink>
    ),
  },
  {
    id: 'whats new',
    element: (
      <ItemLink href="/help/whats_new">
        <FontAwesomeIcon icon={faBullhorn} /> What's New
      </ItemLink>
    ),
  },
  {
    id: 'blog',
    element: (
      <ItemLink href="/blog">
        <FontAwesomeIcon icon={faNewspaper} /> ADS Blog
      </ItemLink>
    ),
  },
  {
    id: 'help',
    element: (
      <ItemLink href="/help">
        <FontAwesomeIcon icon={faQuestionCircle} /> ADS Help Pages
      </ItemLink>
    ),
  },
  {
    id: 'legacy',
    element: (
      <ItemLink href="/help/legacy">
        <FontAwesomeIcon icon={faArchive} /> ADS Legacy Services
      </ItemLink>
    ),
  },
  {
    id: 'careers',
    element: (
      <ItemLink href="/about/careers">
        <FontAwesomeIcon icon={faUsers} /> Careers@ADS
      </ItemLink>
    ),
  },
];

export const AboutDropdown = (): ReactElement => {
  const handleSelect = (id: string) => {
    console.log(id);
    return false;
  };

  return (
    <Dropdown
      label="About"
      items={items}
      onSelect={handleSelect}
      classes={{
        button: 'text-gray-300 hover:text-white focus:text-white',
      }}
      offset={[0, 12]}
    />
  );
};
