import { Meta, Story } from '@storybook/react';
import { AuthorAffiliations, AuthorAffiliationsProps } from '../AuthorAffiliations';

const meta: Meta = {
  title: 'AuthorAffiliations',
  component: AuthorAffiliations,
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<AuthorAffiliationsProps> = (args) => <AuthorAffiliations {...args} />;

export const WithInitialQuery = Template.bind({});

WithInitialQuery.args = {
  query: { q: 'star', rows: 10 },
};

export const WithIntitialParams = Template.bind({});

WithIntitialParams.args = {
  params: { bibcode: ['foo', 'bar', 'baz', 'bim', 'boo', 'bip', 'bop', 'bee', 'biz', 'bot'] },
};

export const WithNoIntitialArgs = Template.bind({});

WithNoIntitialArgs.args = {};
