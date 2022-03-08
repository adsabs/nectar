import { Meta, Story } from '@storybook/react';
import { AllAuthorsModal, IAllAuthorsModalProps } from '@components';

const meta: Meta = {
  title: 'AllAuthorsModal',
  component: AllAuthorsModal,
};

export default meta;

const Template: Story<IAllAuthorsModalProps> = (args) => <AllAuthorsModal {...args} />;

export const Default = Template.bind({}) as Story<IAllAuthorsModalProps>;

Default.args = {
  bibcode: '2022EPJWC.25807009C',
  label: 'Locating the special point of hybrid neutron stars',
};
