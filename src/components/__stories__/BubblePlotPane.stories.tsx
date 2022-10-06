import { BubblePlotPane, IBubblePlotPaneProps } from '@components';
import { data, journalNames } from '@components/__mocks__/bubblePlotData';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/GraphPanes/BubblePlotPane',
  component: BubblePlotPane,
};

export default meta;

const Template: Story<IBubblePlotPaneProps> = (args) => <BubblePlotPane {...args} />;

export const Default = Template.bind({});

Default.args = { nodes: data, journalNames };
