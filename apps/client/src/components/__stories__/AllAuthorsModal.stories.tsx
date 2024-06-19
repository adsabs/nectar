import { Meta, StoryObj } from '@storybook/react';
import { AllAuthorsModal } from '@/components';

const meta: Meta = {
  title: 'AllAuthorsModal',
  component: AllAuthorsModal,
};

type Story = StoryObj<typeof AllAuthorsModal>;

export default meta;

export const Default: Story = {
  args: {
    bibcode: '2022EPJWC.25807009C',
    label: 'Locating the special point of hybrid neutron stars',
  },
};
