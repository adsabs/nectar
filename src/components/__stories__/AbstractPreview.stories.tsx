import { Meta, Story } from '@storybook/react';
import { AbstractPreview, IAbstractPreviewProps } from '@components/ResultList/Item';

const meta: Meta = {
  title: 'ResultList/Item/AbstractPreview',
  component: AbstractPreview,
};

export default meta;

const Template: Story<IAbstractPreviewProps> = (args) => <AbstractPreview {...args} />;

export const Default = Template.bind({}) ;

Default.args = {};
