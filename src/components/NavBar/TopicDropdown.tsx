import { ReactElement, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import { DropdownList, ItemType } from '../Dropdown';
import styles from './NavBar.module.css';

const topics: ItemType[] = [
  {
    id: 'topic-general',
    label: 'General Science',
  },
  {
    id: 'topic-astrophysics',
    label: 'Astrophysics',
  },
  {
    id: 'topic-heliophysics',
    label: 'Heliophysics',
  },
  {
    id: 'topic-planetary',
    label: 'Planetary Science',
  },
  {
    id: 'topic-earth',
    label: 'Earth Science',
  },
  {
    id: 'topic-biophysical',
    label: 'Biological & Physical Science',
  },
];

export const TopicDropdown = (): ReactElement => {
  const [selectedTopic, setSelectedTopic] = useState<ItemType>(topics[0]);

  const getLabelNode = (label: string) => (
    <div
      id="topicSelector"
      className={`${styles['navbar-bg-color']} ${styles['navbar-text-color']} flex items-center justify-between w-64 border border-gray-50 border-opacity-50 rounded-sm cursor-pointer`}
    >
      <span className="inline-block align-baseline p-1.5">{label}</span>
      <ChevronDownIcon className="inline m-1.5 w-4 h-4" />
    </div>
  );

  const handleOnSelect = (topicId: string) => {
    setSelectedTopic(topics.find((topic) => topic.id === topicId));
  };

  return (
    <DropdownList
      label={getLabelNode(selectedTopic.label)}
      items={topics}
      onSelect={handleOnSelect}
      classes={{
        button: '',
      }}
      offset={[0, 4]}
      useCustomLabel={true}
      placement="bottom-start"
      role="listbox"
      ariaLabel="Topic selector"
    />
  );
};
