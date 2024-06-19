import { AbstractRefList } from '@/components';
import { docs } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'AbstractRefList',
  component: AbstractRefList,
  argTypes: {
    onPageChange: { action: 'onPageChange' },
  },
};

type Story = StoryObj<typeof AbstractRefList>;

export default meta;

export const Default: Story = {
  args: { docs, totalResults: docs.length },
};
