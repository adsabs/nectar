import { isBrowser } from '@/utils';
import { useRouter } from 'next/router';
import { MouseEvent, ReactElement } from 'react';
import { MenuDropdown } from './MenuDropdown';
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

export const FeedbackDropdown = (props: IFeedbackDropdownProps): ReactElement => {
  const { type, onFinished } = props;

  const items = Object.values(feedbackItems);

  const router = useRouter();

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = (e.target as HTMLElement).dataset['id'];
    if (isBrowser()) {
      void router.push({ pathname: items.find((item) => id === item.id).path, query: { from: router.asPath } });

      if (typeof onFinished === 'function') {
        onFinished();
      }
    }
  };

  return <MenuDropdown id="feedback" type={type} label="Feedback" items={items} onSelect={handleSelect} />;
};
