import { Meta, Story } from '@storybook/react';
import { ITagsProps, Tags } from '../Tags';

const meta: Meta = {
  title: 'Tags',
  component: Tags,
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

const tagItems = [
  {
    id: 'apple',
    label: 'apple',
  },
  {
    id: 'orange',
    label: 'orange',
  },
  {
    id: 'banana',
    label: 'banana',
  },
  {
    id: 'pear',
    label: 'pear',
  },
];

export default meta;

const Template: Story<ITagsProps> = (args) => <Tags {...args} />;

export const Default = Template.bind({});

Default.args = { tagItems };
