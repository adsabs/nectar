import { ExportApiFormatKey, IExportApiParams } from '@api';
import { composeStories } from '@storybook/testing-react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const checkOutput = (
  el: HTMLTextAreaElement,
  params: Partial<Omit<IExportApiParams, 'bibcode'> & { numRecords: number }> = {},
) => {
  const defaultParams: Omit<IExportApiParams, 'bibcode'> & { numRecords: number } = {
    numRecords: 1,
    format: ExportApiFormatKey.bibtex,
    sort: ['date desc', 'bibcode desc'],
    keyformat: [''],
    authorcutoff: [200],
    journalformat: [1],
    maxauthor: [10],
  };
  const expected = { ...defaultParams, ...params };
  expect(el).toHaveValue(JSON.stringify(expected, Object.keys(expected).sort(), 2));
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
      await waitFor(() => checkOutput(getByTestId('export-output') as HTMLTextAreaElement));
    });
  });

  describe('multi-record mode', () => {
    test('renders without error', () => {
      setup(<MultiRecord />);
    });
    test('has proper output', async () => {
      const { getByTestId } = setup(<MultiRecord />);

      await waitFor(() => checkOutput(getByTestId('export-output') as HTMLTextAreaElement, { numRecords: 10 }));
    });
  });

  describe('no records view', () => {
    test('renders without error', () => {
      const { getByTestId } = setup(<NoRecords />);
      expect(getByTestId('export-heading')).toHaveTextContent('No Records');
    });
  });
});
