import { Meta, Story } from '@storybook/react';
import { BibstemPickerMultiple, IBibstemPickerMultipleProps } from '@components';

const meta: Meta = {
  title: 'BibstemPicker/BibstemPickerMultiple',
  component: BibstemPickerMultiple,
};

export default meta;

const Template: Story<IBibstemPickerMultipleProps> = (args) => <BibstemPickerMultiple {...args} />;

export const Default = Template.bind({}) as Story<IBibstemPickerMultipleProps>;

Default.args = {};
