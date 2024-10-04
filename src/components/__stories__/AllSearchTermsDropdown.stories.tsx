import { Meta, StoryObj } from '@storybook/react';
import { AllSearchTermsDropdown } from '@/components/SearchBar';
import { noop } from '@/utils/common/noop';

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
