import { IExportApiParams } from '@api';
import { composeStories } from '@storybook/testing-react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportApiFormatKey } from '@_api/export';
import { FC } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import * as stories from '../__stories__/CitationExporter.stories';

const { NoRecords, MultiRecord, SingleMode } = composeStories(stories);

const router = {
  pathname: '/',
  push: jest.fn(),
  asPath: '/',
  query: {
    sort: '',
  },
  beforePopState: jest.fn(),
};
jest.mock('next/router', () => ({
  useRouter: () => router,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
const wrapper: FC = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

const checkOutput = async (
  el: HTMLElement,
  params: Partial<Omit<IExportApiParams, 'bibcode'> & { numRecords: number }> = {},
) => {
  const defaultParams: Omit<IExportApiParams, 'bibcode'> & { numRecords: number } = {
    numRecords: 1,
    format: ExportApiFormatKey.bibtex,
    sort: ['date desc'],
    authorcutoff: [10],
    journalformat: [1],
    maxauthor: [0],
  };
  await waitFor(() => expect(el).toHaveValue(JSON.stringify({ ...defaultParams, ...params }, null, 2)));
};

const setup = (component: JSX.Element) => {
  return {
    user: userEvent.setup(),
    ...render(component, { wrapper }),
  };
};

describe('CitationExporter', () => {
  describe('single mode', () => {
    test('renders without error', () => {
      setup(<SingleMode />);
    });
    test('has proper output', async () => {
      const { getByTestId } = setup(<SingleMode />);
      const output = await waitFor(() => getByTestId('export-output'));

      await checkOutput(output);
    });
  });

  describe('multi-record mode', () => {
    test('renders without error', () => {
      setup(<MultiRecord />);
    });
    test('has proper output', async () => {
      const { getAllByTestId } = setup(<MultiRecord />);
      const output = await waitFor(() => getAllByTestId('export-output'));

      await checkOutput(output[0], { numRecords: 10 });
    });
  });

  describe('no records view', () => {
    test('renders without error', () => {
      const { getByTestId } = setup(<NoRecords />);
      expect(getByTestId('export-heading')).toHaveTextContent('No Records');
    });
  });
});
