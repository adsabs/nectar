import { IWordCloudProps, WordCloud } from '@components';
import { wordData } from '@components/__mocks__/wordCloudText';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/Graphs/WordCloud',
  component: WordCloud,
};

export default meta;

const Template: Story<IWordCloudProps> = (args) => <WordCloud {...args} />;

export const Default = Template.bind({});

Default.args = { wordData };
