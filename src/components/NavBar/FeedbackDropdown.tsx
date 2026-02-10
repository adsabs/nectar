import { ChevronDownIcon } from '@chakra-ui/icons';
import { HStack, List, ListItem, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { Fragment, MouseEvent, ReactElement } from 'react';
import { ListType } from './types';

export const feedbackItems = {
  record: {
    id: 'missingrecord',
    path: '/feedback/missingrecord',
    label: 'Missing/Incorrect Record',
  },
  missingreferences: {
    id: 'missingreferences',
    path: '/feedback/missingreferences',
    label: 'Missing References',
  },
  associatedarticles: {
    id: 'associatedarticles',
    path: '/feedback/associatedarticles',
    label: 'Associated Articles',
  },
  general: {
    id: 'general',
    path: '/feedback/general',
    label: 'General Feedback',
  },
};

interface IFeedbackDropdownProps {
  type: ListType;
  onFinished?: () => void;
}

/**
 * Build the href for a feedback item, including the encoded
 * `from` query parameter (with any existing `from` stripped).
 */
const buildHref = (path: string, asPath: string): string => {
  const cleaned = asPath.replace(/from=[^&]+(&|$)/, '');
  return `${path}?from=${encodeURIComponent(cleaned)}`;
};

export const FeedbackDropdown = (props: IFeedbackDropdownProps): ReactElement => {
  const { type, onFinished } = props;
  const items = Object.values(feedbackItems);
  const router = useRouter();

  const handleAccordionClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof onFinished === 'function') {
      // Allow the default navigation but also close the drawer.
      // Use setTimeout so the drawer closes after the click propagates.
      setTimeout(() => onFinished(), 0);
    }

    // If Cmd/Ctrl+Click, let the browser handle natively (new tab)
    if (e.metaKey || e.ctrlKey) {
      return;
    }
  };

  return type === ListType.DROPDOWN ? (
    <Menu variant="navbar" id="nav-menu-feedback">
      <MenuButton>
        <HStack>
          <>Feedback</> <ChevronDownIcon />
        </HStack>
      </MenuButton>
      <MenuList zIndex={500}>
        {items.map((item) => (
          <MenuItem key={item.id} as="a" href={buildHref(item.path, router.asPath)} data-id={item.id}>
            {item.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  ) : (
    <List variant="navbar" role="menu">
      {items.map((item) => (
        <Fragment key={item.id}>
          <ListItem role="menuitem" id={`feedback-item-${item.id}`}>
            <a
              href={buildHref(item.path, router.asPath)}
              onClick={handleAccordionClick}
              style={{ display: 'block', width: '100%' }}
            >
              {item.label}
            </a>
          </ListItem>
        </Fragment>
      ))}
    </List>
  );
};
