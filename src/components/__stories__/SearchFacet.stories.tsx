import { Box, List } from '@chakra-ui/react';
import { ISearchFacetTreeProps, SearchFacetTree } from '@components/SearchFacet/SearchFacetTree';
import { Meta, Story } from '@storybook/react';
import { ISearchFacetsProps, SearchFacets } from '../SearchFacet';

const meta: Meta = {
  title: 'SearchFacet',
  component: SearchFacets,
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

const Template: Story<ISearchFacetsProps> = (args) => (
  <Box w="200px">
    <SearchFacets {...args} />
  </Box>
);

const TreeTemplate: Story<ISearchFacetTreeProps> = (args) => (
  <List w="200px">
    <SearchFacetTree {...args} />
  </List>
);

export const All = Template.bind({});
export const Tree = TreeTemplate.bind({});

All.args = {};
Tree.args = {
  field: 'first_author_facet_hier',
  hasChildren: true,
  logic: { single: ['and'], multiple: ['and'] },
};
