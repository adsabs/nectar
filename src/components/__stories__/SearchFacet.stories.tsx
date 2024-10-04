import { Meta, StoryObj } from '@storybook/react';
import { Box } from '@chakra-ui/react';
import { AppMode } from '@/types';
import { ComponentProps } from 'react';
import { useStore } from '@/store';
import { SearchFacets } from '@/components/SearchFacet';
import { noop } from '@/utils/common/noop';
import { enumKeys } from '@/utils/common/enumKeys';

type PagePropsAndCustomArgs = ComponentProps<typeof SearchFacets> & { mode: AppMode };

const meta: Meta<PagePropsAndCustomArgs> = {
  title: 'SearchFacets/SearchFacets',
  component: SearchFacets,
  argTypes: {
    onQueryUpdate: { table: { disable: true } },
    mode: {
      control: {
        type: 'select',
      },
      options: enumKeys(AppMode),
    },
  },
  render: function Render(args) {
    const setMode = useStore((state) => state.setMode);
    setMode(args.mode);
    return (
      <Box w="sm">
        <SearchFacets onQueryUpdate={noop} />
      </Box>
    );
  },
};

type Story = StoryObj<PagePropsAndCustomArgs>;
export default meta;

export const Default: Story = {
  args: {
    mode: AppMode.GENERAL,
  },
};
