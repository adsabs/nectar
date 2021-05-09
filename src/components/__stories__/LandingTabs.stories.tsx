import { Meta, Story } from '@storybook/react';
import React from 'react';
import { ILandingTabsProps, LandingTabs } from '../LandingTabs';

const meta: Meta = {
  title: 'LandingTabs',
  component: LandingTabs,
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<ILandingTabsProps> = (args) => <LandingTabs {...args} />;

export const Default = Template.bind({}) as Story<ILandingTabsProps>;

Default.args = {};
