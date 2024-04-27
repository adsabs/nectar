import { ListType } from './types';
import { MouseEvent, ReactElement, useState } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { Icon, Modal, ModalCloseButton, ModalContent, ModalOverlay, useDisclosure } from '@chakra-ui/react';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { PlanetaryFeatures } from '@/components/Experiments/PlanetaryFeatures';

const items = [
  {
    id: 'planetary_features',
    path: '',
    label: 'Search Planetary Features',
    enabled: true,
  },
];

interface IAboutDropdownProps {
  onFinished?: () => void;
}

export const ExperimentsDropdown = (props: IAboutDropdownProps): ReactElement => {
  const { onFinished } = props;
  const { isOpen, onClose, onOpen } = useDisclosure({
    id: 'experiments-modal',
  });
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (e: MouseEvent<HTMLElement>) => {
    const id = e.currentTarget.dataset['id'];
    if (id === 'no-experiments') {
      return;
    }
    setSelected(id);
    onOpen();
    if (typeof onFinished === 'function') {
      onFinished();
    }
  };

  const list = items.filter((item) => item.enabled);
  if (list.length === 0) {
    list.push({
      id: 'no-experiments',
      path: '',
      label: 'No Experiments',
      enabled: true,
    });
  }

  return (
    <>
      <MenuDropdown
        id="experiments"
        type={ListType.DROPDOWN}
        hideChevron
        label={<Icon aria-label="open experiments menu" as={BeakerIcon} fontSize="18" />}
        items={list}
        onSelect={handleSelect}
      />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          {selected === 'planetary_features' ? <PlanetaryFeatures onClose={onClose} /> : null}
        </ModalContent>
      </Modal>
    </>
  );
};
