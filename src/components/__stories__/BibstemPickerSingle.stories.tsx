import { Meta, Story } from '@storybook/react';
import { BibstemPickerSingle, IBibstemPickerSingleProps } from '@components';

const meta: Meta = {
  title: 'BibstemPicker/BibstemPickerSingle',
  component: BibstemPickerSingle,
};

export default meta;

const Template: Story<IBibstemPickerSingleProps> = (args) => <BibstemPickerSingle {...args} />;

export const Default = Template.bind({}) ;

Default.args = {
  name: 'bibstem',
};
