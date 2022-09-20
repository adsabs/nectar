import { IWordCloudProps, WordCloud } from '@components';
import { fill, wordData } from '@components/__mocks__/wordCloud';
import { Meta, Story } from '@storybook/react';
import * as d3 from 'd3';

const meta: Meta = {
  title: 'Visualizations/Graphs/WordCloud',
  component: WordCloud,
};

export default meta;

const Template: Story<IWordCloudProps> = (args) => <WordCloud {...args} />;

export const Default = Template.bind({});

Default.args = { wordData, fill };
