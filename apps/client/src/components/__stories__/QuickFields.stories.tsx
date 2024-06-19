import { QuickFields } from '@/components';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof QuickFields> = {
  title: 'SearchBar/QuickFields',
  component: QuickFields,
};

type Story = StoryObj<typeof QuickFields>;
export default meta;

export const Default: Story = {};
