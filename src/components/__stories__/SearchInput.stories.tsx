import { Meta, StoryObj } from '@storybook/react';
import { SearchInput } from '@/components/SearchBar';

const meta: Meta<typeof SearchInput> = {
  title: 'SearchBar/Input',
  component: SearchInput,
};

type Story = StoryObj<typeof SearchInput>;
export default meta;

export const Default: Story = {};
export const Loading: Story = {
  args: { isLoading: true },
};
