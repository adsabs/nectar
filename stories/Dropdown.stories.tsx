import { DropdownBasic, IDropdownBasicProps } from '@components/Dropdown';
import { Meta, Story } from '@storybook/react';
import React from 'react';

const meta: Meta<IDropdownBasicProps> = {
  title: 'Dropdown',
  component: DropdownBasic,
  argTypes: {
    items: {
      defaultValue: [
        { label: 'First' },
        { label: 'Second' },
        { label: 'Third' },
      ],
    },
  },
  parameters: {
    controls: { expanded: true },
  },
  args: {
    label: '',
  },
};

export default meta;

const Template: Story<IDropdownBasicProps> = (args) => (
  <DropdownBasic {...args} />
);

export const Default: Story<IDropdownBasicProps> = Template.bind({});

export const DefaultArgs: IDropdownBasicProps = (Default.args = {
  label: 'Dropdown',
});
