import { SearchInput } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

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
