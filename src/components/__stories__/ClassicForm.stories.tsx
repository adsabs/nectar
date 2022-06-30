import { Meta, Story } from '@storybook/react';
import { ClassicForm, IClassicFormProps } from '../ClassicForm';

const meta: Meta = {
  title: 'ClassicForm',
  component: ClassicForm,
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

const Template: Story<IClassicFormProps> = (args) => <ClassicForm {...args} />;

export const Default = Template.bind({});

Default.args = {};
