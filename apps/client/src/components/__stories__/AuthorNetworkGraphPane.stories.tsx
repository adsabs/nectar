import { AuthorNetworkGraphPane } from '@/components';
import { IView } from '@/components/Visualizations/GraphPanes/types';
import { response } from '@/components/__mocks__/networkResponseData';
import { Meta, StoryObj } from '@storybook/react';
import { noop } from '@/utils';

const meta: Meta = {
  title: 'Visualizations/GraphPanes/AuthorNetworkGraphPane',
  component: AuthorNetworkGraphPane,
};

type Story = StoryObj<typeof AuthorNetworkGraphPane>;

export default meta;

const views: IView[] = [
  { id: 'author_occurrences', label: 'Author Occurrences', valueToUse: 'size' },
  {
    id: 'paper_citations',
    label: 'Paper Citations',
    valueToUse: 'citation_count',
  },
  { id: 'paper_downloads', label: 'Paper Downloads', valueToUse: 'read_count' },
];

export const Default: Story = {
  args: {
    root: response.data.root,
    linksData: response.data.link_data,
    views,
    onChangePaperLimit: noop,
    maxPaperLimit: 200,
    paperLimit: 200,
  },
};
