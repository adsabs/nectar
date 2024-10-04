import { Meta, StoryObj } from '@storybook/react';

import { libraries } from '@/components/__mocks__/libraries';
import { LibraryListTable } from '@/components/Libraries';
import { noop } from '@/utils/common/noop';

const meta: Meta = {
  title: 'Library/LibraryListTable',
  component: LibraryListTable,
};

type Story = StoryObj<typeof LibraryListTable>;

export default meta;

export const Default: Story = {
  args: {
    libraries: libraries,
    onChangeSort: noop,
    sort: { col: 'name', dir: 'asc' },
    entries: 99,
    pageIndex: 2,
    pageSize: 10,
  },
};

export const Empty: Story = { args: { libraries: [] } };
