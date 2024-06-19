import { YearsGraphPane } from '@/components';
import { Meta, StoryObj } from '@storybook/react';
import { facetFoundFieldsData } from '@/components/__mocks__/facetCountFields';

const meta: Meta = {
  title: 'Visualizations/YearsGraphPane',
  component: YearsGraphPane,
};

type Story = StoryObj<typeof YearsGraphPane>;
export default meta;

export const Default: Story = {
  args: { data: facetFoundFieldsData },
};
