import { ReactElement, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import { DropdownList, ItemType } from '../Dropdown';

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
  const [expanded, setExpanded] = useState<boolean>(false);

  const getLabelNode = (label: string) => (
    <div
      id="topicSelector"
      className="navbar-bg-color navbar-text-color flex items-center justify-between w-64 border border-gray-50 border-opacity-50 rounded-sm cursor-pointer"
    >
      <span className="inline-block align-baseline p-1.5">{label}</span>
      <ChevronDownIcon className="inline m-1.5 w-4 h-4" />
    </div>
  );

  return (
    <div role="listbox" aria-label="Topic Selector" aria-expanded={expanded}>
      <DropdownList
        label={getLabelNode(selectedTopic.label)}
        items={topics}
        onSelect={(topicId: string) => {
          setSelectedTopic(topics.find(topic => topic.id === topicId));
        }}
        onExpanded={() => setExpanded(true)}
        onClosed={() => setExpanded(false)}
        classes={{
          button: '',
        }}
        useCustomLabel={true}
        placement='bottom-start'
        role='listbox'
        ariaLabel="Topic selector"
      />
    </div>
  );
};
