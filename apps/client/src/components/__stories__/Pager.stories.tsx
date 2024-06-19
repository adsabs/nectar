import { Meta, StoryObj } from '@storybook/react';
import { IPagerProps, Pager } from '../Pager';

const meta: Meta<IPagerProps> = {
  title: 'Pager',
  component: Pager,
};

type Story = StoryObj<IPagerProps>;
export default meta;

export const Default: Story = {
  render: () => (
    <Pager
      pages={[
        { title: 'First', content: 'Page 1', uniqueId: 'first' },
        { title: 'Second', content: 'Page 2', uniqueId: 'second' },
        { title: 'Third', content: 'Page 3', uniqueId: 'third' },
        { title: 'Fourth', content: 'Page 4', uniqueId: 'fourth' },
        { title: 'Fifth', content: 'Page 5', uniqueId: 'fifth' },
        { title: 'Sixth', content: 'Page 6', uniqueId: 'sixth' },
      ]}
    />
  ),
};

export const WithDynamicContent: Story = {
  render: () => (
    <Pager
      pages={[
        {
          title: 'First',
          content: (ctx) => <pre>{JSON.stringify(ctx)}</pre>,
          uniqueId: 'first',
        },
        {
          title: 'Second',
          content: (ctx) => <pre>{JSON.stringify(ctx)}</pre>,
          uniqueId: 'second',
        },
      ]}
    />
  ),
};
