import { isBrowser } from '@utils';
import { useRouter } from 'next/router';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { ListType } from './types';

const items = [
  {
    id: 'record',
    path: '/feedback/record',
    label: 'Missing/Incorrect Record',
  },
  {
    id: 'references',
    path: '/feedback/references',
    label: 'Missing References',
  },
  {
    id: 'associated-articles',
    path: '/feedback/associated-articles',
    label: 'Associated Articles',
  },
  {
    id: 'general',
    path: '/feedback/general',
    label: 'General Feedback',
  },
];

interface IFeedbackDropdownProps {
  type: ListType;
  onFinished?: () => void;
}

export const FeedbackDropdown = (props: IFeedbackDropdownProps): ReactElement => {
  const { type, onFinished } = props;

  const router = useRouter();

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      void router.push(items.find((item) => id === item.id).path);

      if (typeof onFinished === 'function') {
        onFinished();
      }
    }
  };

  return <MenuDropdown id="feedback" type={type} label="Feedback" items={items} onSelect={handleSelect} />;
};
