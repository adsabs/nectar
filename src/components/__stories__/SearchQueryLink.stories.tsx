import { Meta, Story } from '@storybook/react';
import { SearchQueryLink, ISearchQueryLinkProps } from '../SearchQueryLink';

const meta: Meta = {
  title: 'SearchQueryLink',
  component: SearchQueryLink,
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

const Template: Story<ISearchQueryLinkProps> = args => <SearchQueryLink {...args} />;

export const Default = Template.bind({}) as Story<ISearchQueryLinkProps>;

Default.args = {};
