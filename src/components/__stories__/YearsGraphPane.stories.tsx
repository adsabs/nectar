import { IYearsGraphPaneProps, YearsGraphPane } from '@components';
import { facetFoundFieldsData } from '@components/__mocks__/facetCountFields';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/YearsGraphPane',
  component: YearsGraphPane,
};

export default meta;

const Template: Story<IYearsGraphPaneProps> = (args) => <YearsGraphPane {...args} />;

export const Default = Template.bind({});

Default.args = { data: facetFoundFieldsData };
