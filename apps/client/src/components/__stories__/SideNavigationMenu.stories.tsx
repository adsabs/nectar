import { SideNavigationMenu } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'NavigationMenu/SideNavigationMenu',
  component: SideNavigationMenu,
};

type Story = StoryObj<typeof SideNavigationMenu>;

const menuItems1 = {
  'USER PREFERENCES': [
    {
      id: 'libraryimport',
      href: `/libraryimport`,
      label: 'Import Libraries',
    },
    {
      id: 'librarylink',
      href: `/librarylink`,
      label: 'Library Link Server',
    },
    {
      id: 'orcid',
      href: `/orcid`,
      label: 'ORCiD',
    },
    {
      id: 'application',
      href: `/application`,
      label: 'Search',
    },
    {
      id: 'export',
      href: `/export`,
      label: 'Export',
    },
  ],
  'ACCOUNT SETTINGS': [
    {
      id: 'email',
      href: `/email`,
      label: 'Change Email',
    },
    {
      id: 'password',
      href: `/password`,
      label: 'Change Password',
    },
    {
      id: 'token',
      href: `/token`,
      label: 'API Token',
    },
    {
      id: 'delete',
      href: `/delete`,
      label: 'Delete Account',
    },
  ],
};

const menuItems2 = [
  {
    id: 'libraryimport',
    href: `/libraryimport`,
    label: 'Import Libraries',
  },
  {
    id: 'librarylink',
    href: `/librarylink`,
    label: 'Library Link Server',
  },
  {
    id: 'orcid',
    href: `/orcid`,
    label: 'ORCiD',
  },
  {
    id: 'application',
    href: `/application`,
    label: 'Search',
  },
  {
    id: 'export',
    href: `/export`,
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
