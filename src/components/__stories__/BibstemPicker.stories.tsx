import { Meta, StoryObj } from '@storybook/react';
import { BibstemPicker } from '@/components/BibstemPicker';

const meta: Meta = {
  title: 'BibstemPicker/BibstemPicker',
  component: BibstemPicker,
};

type Story = StoryObj<typeof BibstemPicker>;

export default meta;

export const Default: Story = {
  args: {},
};

export const Multi: Story = {
  args: {
    isMultiple: true,
  },
};
