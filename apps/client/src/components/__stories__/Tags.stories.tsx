import { Meta, StoryObj } from '@storybook/react';
import { Tags } from '../Tags';
import { noop } from '@/utils';

const meta: Meta = {
  title: 'Tags',
  component: Tags,
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

type Story = StoryObj<typeof meta.component>;

const tagItems = [
  {
    id: 'apple',
    label: 'apple',
  },
  {
    id: 'orange',
    label: 'orange',
  },
  {
    id: 'banana',
    label: 'banana',
  },
  {
    id: 'pear',
    label: 'pear',
  },
];

export default meta;

export const Default: Story = {
  args: { tagItems, onClear: noop, onRemove: noop },
};
