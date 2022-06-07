import { IAllSearchTermsDropdown, AllSearchTermsDropdown } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'SearchBar/AllSearchTermsDropdown',
  component: AllSearchTermsDropdown,
};

export default meta;

const Template: Story<IAllSearchTermsDropdown> = (args) => <AllSearchTermsDropdown {...args} />;

export const Default = Template.bind({});
