import { docs } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';
import { AbstractRefList } from '@/components/AbstractRefList';

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
