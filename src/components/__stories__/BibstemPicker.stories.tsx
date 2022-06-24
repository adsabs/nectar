import { BibstemPicker, IBibstemPickerProps } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'BibstemPicker/BibstemPicker',
  component: BibstemPicker,
};

export default meta;

const Template: Story<Omit<IBibstemPickerProps, 'ref'>> = (args) => <BibstemPicker {...args} />;

export const Default = Template.bind({});
export const Multi = Template.bind({});

Default.args = {};

Multi.args = {
  isMultiple: true,
};
