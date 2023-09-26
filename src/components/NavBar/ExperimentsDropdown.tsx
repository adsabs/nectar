import { ListType } from './types';
import { MouseEvent, ReactElement, useState } from 'react';
import { MenuDropdown } from './MenuDropdown';
import { Icon, IconButton, Modal, ModalCloseButton, ModalContent, ModalOverlay, useDisclosure } from '@chakra-ui/react';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { PlanetaryFeatures } from '@components/Experiments/PlanetaryFeatures';

const items = [
  {
    id: 'planetary_features',
    path: '',
    label: 'Search Planetary Features',
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
    setSelected(id);
    onOpen();
    if (typeof onFinished === 'function') {
      onFinished();
    }
  };

  return (
    <>
      <MenuDropdown
        id="experiments"
        type={ListType.DROPDOWN}
        hideChevron
        label={
          <IconButton
            aria-label="open experiments menu"
            icon={<Icon as={BeakerIcon} fontSize="18" />}
            colorScheme="black"
          />
        }
        items={items}
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
