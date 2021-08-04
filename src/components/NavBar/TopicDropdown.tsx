import { ReactElement, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import { DropdownList, ItemType } from '../Dropdown';
import { AppEvent, useAppCtx } from '@store';
import { Topic } from '@types';
import styles from './NavBar.module.css';

const topics: ItemType[] = [
  {
    id: Topic.GENERAL,
    domId: 'topic-general',
    label: 'General Science',
  },
  {
    id: Topic.ASTROPHYSICS,
    domId: 'topic-astrophysics',
    label: 'Astrophysics',
  },
  {
    id: Topic.HELIOPHYISCS,
    domId: 'topic-heliophysics',
    label: 'Heliophysics',
  },
  {
    id: Topic.PLANET_SCIENCE,
    domId: 'topic-planetary',
    label: 'Planetary Science',
  },
  {
    id: Topic.EARTH_SCIENCE,
    domId: 'topic-earth',
    label: 'Earth Science',
  },
  {
    id: Topic.BIO_PHYSICAL,
    domId: 'topic-biophysical',
    label: 'Biological & Physical Science',
  },
];

export const TopicDropdown = (): ReactElement => {

  const { state: appState, dispatch } = useAppCtx();

  const getUserTopic = () => {
    const userTopic = appState.topic.toString();
    return userTopic? userTopic : Topic.GENERAL;
  }

  const [selectedTopic, setSelectedTopic] = useState<string>(getUserTopic());

  const setUserTopic = (topicId: string) => {
    dispatch({type: AppEvent.SET_TOPIC, payload: topicId as Topic});
    setSelectedTopic(topicId);
  }

  const getLabelNode = (itemId: string) => {
    const label = topics.find(item => item.id === itemId).label;
    return (
    <div
      id="topicSelector"
      className={`${styles['navbar-bg-color']} ${styles['navbar-text-color']} flex items-center justify-between w-64 border border-gray-50 border-opacity-50 rounded-sm cursor-pointer`}
    >
      <span className="inline-block align-baseline p-1.5">{label}</span>
      <ChevronDownIcon className="inline m-1.5 w-4 h-4" />
    </div>
    )
  };

  const handleOnSelect = (topicId: string) => {
    setUserTopic(topicId);
    setSelectedTopic(topics.find((topic) => topic.id === topicId).id);
  };

  return (
    <DropdownList
      label={getLabelNode(selectedTopic)}
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
