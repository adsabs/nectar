import { SearchFacets } from '@/components';
import { Meta, StoryObj } from '@storybook/react';
import { Box } from '@chakra-ui/react';
import { AppMode } from '@/types';
import { ComponentProps } from 'react';
import { enumKeys, noop } from '@/utils';
import { useStore } from '@/store';

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
