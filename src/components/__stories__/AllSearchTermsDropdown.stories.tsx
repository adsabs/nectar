import { Meta, StoryObj } from '@storybook/react';
import { noop } from '@/utils';
import { AllSearchTermsDropdown } from '@/components/SearchBar';

const meta: Meta<typeof AllSearchTermsDropdown> = {
  title: 'SearchBar/AllSearchTermsDropdown',
  component: AllSearchTermsDropdown,
};

type Story = StoryObj<typeof AllSearchTermsDropdown>;

export default meta;

export const Default: Story = {
  args: {
    onSelect: noop,
  },
};
