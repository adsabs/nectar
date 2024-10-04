import { fill, wordData } from '@/components/__mocks__/wordCloud';
import { Meta, StoryObj } from '@storybook/react';
import { WordCloud } from '@/components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/Graphs/WordCloud',
  component: WordCloud,
};

type Story = StoryObj<typeof WordCloud>;

export default meta;

export const Default: Story = {
  args: { wordData, fill },
};
