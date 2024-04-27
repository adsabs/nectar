import { Meta, StoryObj } from '@storybook/react';
import { AbstractPreview } from '@/components/ResultList/Item';

const meta: Meta = {
  title: 'ResultList/Item/AbstractPreview',
  component: AbstractPreview,
};

type Story = StoryObj<typeof AbstractPreview>;

export default meta;

export const Default: Story = {
  args: {},
};
