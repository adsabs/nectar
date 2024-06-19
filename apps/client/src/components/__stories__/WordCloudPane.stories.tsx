import { IWordCloudPaneProps, WordCloudPane } from '@/components';
import { fill, wordData } from '@/components/__mocks__/wordCloud';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/GraphPanes/WordCloudPane',
  component: WordCloudPane,
};

type Story = StoryObj<typeof WordCloudPane>;

export default meta;

const sliderValues: IWordCloudPaneProps['sliderValues'] = [
  ['2', 1],
  ['1', 2],
  ['0', 3],
  ['1', 4],
  ['2', 5],
];

export const Default: Story = {
  args: { wordData, fill, sliderValues, currentSliderValue: 3 },
};
