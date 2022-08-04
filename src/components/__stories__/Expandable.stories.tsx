import { Meta, Story } from '@storybook/react';
import { Expandable, IExpandableProps } from '../Expandable';

const meta: Meta = {
  title: 'Expandable',
  component: Expandable,
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

export default meta;

const Template: Story<IExpandableProps> = (args) => <Expandable {...args} />;

export const Default = Template.bind({});

Default.args = {
  title: 'Click me for description',
  description:
    'Sweet are the uses of adversity which, like the toad, ugly and venomous, wears yet a precious jewel in his head',
};
