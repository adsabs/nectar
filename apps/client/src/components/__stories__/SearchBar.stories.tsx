import { SearchBar } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SearchBar> = {
  title: 'SearchBar/SearchBar',
  component: SearchBar,
};

type Story = StoryObj<typeof SearchBar>;

export default meta;

export const Basic: Story = {};
export const Loading: Story = {
  args: { isLoading: true },
};
