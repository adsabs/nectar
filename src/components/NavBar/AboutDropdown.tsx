import Link from 'next/link';
import React, { FC, ReactElement } from 'react';
import { DropdownList, ItemType } from '../Dropdown';

interface IItemLinkProps {
  href: string;
}
const ItemLink: FC<IItemLinkProps> = (props): ReactElement => {
  const { href, children } = props;

  return (
    <Link href={href}>
      <a>
        <div className="w-full h-full text-gray-700">{children}</div>
      </a>
    </Link>
  );
};

const items: ItemType[] = [
  {
    id: 'about',
    element: <ItemLink href="/about"> About ADS</ItemLink>,
  },
  {
    id: 'whats new',
    element: <ItemLink href="/help/whats_new"> What's New</ItemLink>,
  },
  {
    id: 'blog',
    element: <ItemLink href="/blog"> ADS Blog</ItemLink>,
  },
  {
    id: 'help',
    element: <ItemLink href="/help"> ADS Help Pages</ItemLink>,
  },
  {
    id: 'legacy',
    element: <ItemLink href="/help/legacy"> ADS Legacy Services</ItemLink>,
  },
  {
    id: 'careers',
    element: <ItemLink href="/about/careers"> Careers@ADS</ItemLink>,
  },
];

export const AboutDropdown = (): ReactElement => {
  const handleSelect = (id: string) => {
    console.log(id);
    return false;
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
    />
  );
};
