import { TopNavigationMenu } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'NavigationMenu/TopNavigationMenu',
  component: TopNavigationMenu,
};

type Story = StoryObj<typeof TopNavigationMenu>;

const menuItems1 = {
  'USER PREFERENCES': [
    {
      id: 'libraryimport',
      href: `/libraryimport`,
      hrefAs: `/libraryimport`,
      label: 'Import Libraries',
    },
    {
      id: 'librarylink',
      href: `/librarylink`,
      hrefAs: `/librarylink`,
      label: 'Library Link Server',
    },
    {
      id: 'orcid',
      href: `/orcid`,
      hrefAs: `/orcid`,
      label: 'ORCiD',
    },
    {
      id: 'application',
      href: `/application`,
      hrefAs: `/application`,
      label: 'Search',
    },
    {
      id: 'export',
      href: `/export`,
      hrefAs: `/export`,
      label: 'Export',
    },
  ],
  'ACCOUNT SETTINGS': [
    {
      id: 'email',
      href: `/email`,
      hrefAs: `/email`,
      label: 'Change Email',
    },
    {
      id: 'password',
      href: `/password`,
      hrefAs: `/password`,
      label: 'Change Password',
    },
    {
      id: 'token',
      href: `/token`,
      hrefAs: `/token`,
      label: 'API Token',
    },
    {
      id: 'delete',
      href: `/delete`,
      hrefAs: `/delete`,
      label: 'Delete Account',
    },
  ],
};

const menuItems2 = [
  {
    id: 'libraryimport',
    href: `/libraryimport`,
    hrefAs: `/libraryimport`,
    label: 'Import Libraries',
  },
  {
    id: 'librarylink',
    href: `/librarylink`,
    hrefAs: `/librarylink`,
    label: 'Library Link Server',
  },
  {
    id: 'orcid',
    href: `/orcid`,
    hrefAs: `/orcid`,
    label: 'ORCiD',
  },
  {
    id: 'application',
    href: `/application`,
    hrefAs: `/application`,
    label: 'Search',
  },
  {
    id: 'export',
    href: `/export`,
    hrefAs: `/export`,
    label: 'Export',
  },
];
export default meta;

export const Primary: Story = {
  args: {
    menuItems: menuItems1,
    activeItem: menuItems1['ACCOUNT SETTINGS'][0],
  },
};

export const SingleList: Story = {
  args: {
    menuItems: menuItems2,
    activeItem: menuItems2[0],
  },
};
