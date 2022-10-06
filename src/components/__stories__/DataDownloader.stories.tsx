import { Meta, Story } from '@storybook/react';
import { DataDownloader, IDataDownloaderProps } from '../DataDownloader';

const meta: Meta = {
  title: 'DataDownloader',
  component: DataDownloader,
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

const csvdata =
  'First, Last, Street, City, State, Zip\n' +
  'John,Doe,120 jefferson st.,Riverside, NJ, 08075\n' +
  'Jack,McGinnis,220 hobo Av.,Phila, PA,09119\n' +
  '"John ""Da Man""",Repici,120 Jefferson St.,Riverside, NJ,08075\n' +
  'Stephen,Tyler,"7452 Terrace ""At the Plaza"" road",SomeTown,SD, 91234\n' +
  ',Blankman,,SomeTown, SD, 00298\n' +
  '"Joan ""the bone"", Anne",Jet,"9th, at Terrace plc",Desert City,CO,00123\n';

const getFileContent = () => csvdata;

const Template: Story<IDataDownloaderProps> = (args) => <DataDownloader {...args} />;

export const Default = Template.bind({});

Default.args = { label: 'click to download', getFileContent, fileName: 'addresses.csv' };
