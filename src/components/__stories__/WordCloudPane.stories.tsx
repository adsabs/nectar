import { IWordCloudPaneProps, WordCloudPane } from '@components/Visualizations/GraphPanes/WordCloudPane';
import { fill, wordData } from '@components/__mocks__/wordCloud';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/GraphPanes/WordCloudPane',
  component: WordCloudPane,
};

export default meta;

const Template: Story<IWordCloudPaneProps> = (args) => <WordCloudPane {...args} />;

export const Default = Template.bind({});

Default.args = { wordData, fill, sliderValues: [1, 2, 3, 4, 5], currentSliderValue: 3 };
