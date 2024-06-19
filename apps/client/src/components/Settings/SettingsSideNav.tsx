import { SideNavigationMenu, TopNavigationMenu } from '@/components/NavigationMenu';
import { useRouter } from 'next/router';

const settingsPath = '/user/settings';

const useGetMenuItems = () => {
  const router = useRouter();
  const menuItems = {
    'USER PREFERENCES': [
      {
        id: 'application',
        href: `${settingsPath}/application`,
        label: 'Search',
      },
      {
        id: 'export',
        href: `${settingsPath}/export`,
        label: 'Export',
      },
      {
        id: 'librarylink',
        href: `${settingsPath}/librarylink`,
        label: 'Library Link Server',
      },
      {
        id: 'orcid',
        href: `${settingsPath}/orcid`,
        label: 'ORCiD',
      },
    ],
    'ACCOUNT SETTINGS': [
      {
        id: 'email',
        href: `${settingsPath}/email`,
        label: 'Change Email',
      },
      {
        id: 'password',
        href: `${settingsPath}/password`,
        label: 'Change Password',
      },
      {
        id: 'token',
        href: `${settingsPath}/token`,
        label: 'API Token',
      },
      {
        id: 'delete',
        href: `${settingsPath}/delete`,
        label: 'Delete Account',
      },
    ],
  };

  return {
    menuItems,
    activeItem:
      Object.values(menuItems)
        .flat()
        .find((item) => router.asPath.indexOf(`${item.href}`) > -1) ?? menuItems['USER PREFERENCES'][0], // if no match (redirected), use the first item
  };
};

export const SettingsSideNav = () => {
  const { menuItems, activeItem } = useGetMenuItems();

  return (
    <>
      {/* Large viewports */}
      <SideNavigationMenu
        menuItems={menuItems}
        activeItem={activeItem}
        my={2}
        display={{ base: 'none', lg: 'initial' }}
        w="72"
      />

      {/* Small viewports */}
      <TopNavigationMenu
        menuItems={menuItems}
        activeItem={activeItem}
        display={{ base: 'initial', lg: 'none' }}
        mx={2}
        zIndex={100}
      />
    </>
  );
};
