import { Meta, StoryObj } from '@storybook/react';
import { IPagerProps, Pager } from '../Pager';

const meta: Meta<IPagerProps> = {
  title: 'Pager',
  component: Pager,
};

type Story = StoryObj<IPagerProps>;
export default meta;

const template: Story = {
  render: () => (
    <Pager
      pages={[
        { title: 'First', content: 'Page 1' },
        { title: 'Second', content: 'Page 2' },
        { title: 'Third', content: 'Page 3' },
        { title: 'Fourth', content: 'Page 4' },
        { title: 'Fifth', content: 'Page 5' },
        { title: 'Sixth', content: 'Page 6' },
      ]}
    />
  ),
};

export const Default: Story = {
  ...template,
};

export const WithDynamicContent: Story = {
  render: () => (
    <Pager
      pages={[
        {
          title: 'First',
          content: (ctx) => <pre>{JSON.stringify(ctx)}</pre>,
        },
        {
          title: 'Second',
          content: (ctx) => <pre>{JSON.stringify(ctx)}</pre>,
        },
      ]}
    />
  ),
};
