import { Meta, Story } from '@storybook/react';
import { AuthorAffiliations, IAuthorAffiliationsProps } from '../AuthorAffiliations';

const meta: Meta = {
  title: 'AuthorAffiliations',
  component: AuthorAffiliations,
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

const Template: Story<IAuthorAffiliationsProps> = args => <AuthorAffiliations {...args} />;

export const Default = Template.bind({});

Default.args = {};
