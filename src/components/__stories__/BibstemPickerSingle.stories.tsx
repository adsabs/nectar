import { BibstemPickerSingle, IBibstemPickerSingleProps } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'BibstemPicker/BibstemPickerSingle',
  component: BibstemPickerSingle,
};

export default meta;

const Template: Story<Omit<IBibstemPickerSingleProps, 'ref'>> = (args) => <BibstemPickerSingle {...args} />;

export const Default = Template.bind({});

Default.args = {
  name: 'bibstem',
};
