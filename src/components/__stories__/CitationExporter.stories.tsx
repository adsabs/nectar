import { ExportApiFormatKey } from '@api';
import { Meta, Story } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CitationExporter, ICitationExporterProps } from '../CitationExporter';

const meta: Meta = {
  title: 'CitationExporter',
  component: CitationExporter,
  argTypes: {
    initialRecords: {
      control: false,
    },
  },
  parameters: {
    controls: { expanded: true },
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;

const Template: Story<ICitationExporterProps> = (args) => <CitationExporter {...args} />;

export const NoRecords = Template.bind({});
export const OneRecord = Template.bind({});
export const MultiRecord = Template.bind({});
export const SingleMode = Template.bind({});

NoRecords.args = {
  records: [],
};
OneRecord.args = {
  records: ['2021APS..APRA01003G'],
};
MultiRecord.args = {
  initialFormat: ExportApiFormatKey.bibtex,
  records: [
    '2021APS..APRA01003G',
    '2018cosp...42E1191G',
    '2017koa..prop..257G',
    '2015koa..prop..493G',
    '2015koa..prop..393G',
    '2015IAUGA..2258598G',
    '2015IAUGA..2258584G',
    '2014koa..prop..669G',
    '2014koa..prop..579G',
    '2014ATel.6110....1G',
  ],
  totalRecords: 100,
};
SingleMode.args = {
  records: ['2021APS..APRA01003G'],
  singleMode: true,
};
