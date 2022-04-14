import { composeStories } from '@storybook/testing-react';
import { render } from '@testing-library/react';
import { FC } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import * as stories from '../__stories__/CitationExporter.stories';

const { OneRecord, NoRecords, MultiRecord, SingleMode } = composeStories(stories);

const router = {
  pathname: '/',
  push: jest.fn(),
  asPath: '/',
  query: {
    sort: '',
  },
};
jest.mock('next/router', () => ({
  useRouter: () => router,
}));

const queryClient = new QueryClient();
const wrapper: FC = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

describe('CitationExporter', () => {
  it('renders without crashing', () => {
    render(<OneRecord />, { wrapper });
    render(<NoRecords />, { wrapper });
    render(<MultiRecord />, { wrapper });
    render(<SingleMode />, { wrapper });
  });

  it('renders "no records" input properly', () => {
    const { getByTestId } = render(<NoRecords />, { wrapper });
    expect(getByTestId('export-heading')).toHaveTextContent('No Records');
  });

  it('renders single record properly input properly', () => {
    const { getByTestId } = render(<OneRecord />, { wrapper });
    expect(getByTestId('export-heading')).toHaveTextContent('Exporting record 1 of 1 (total: 1)');
  });

  it('renders single record properly input properly', () => {
    const { getByTestId } = render(<MultiRecord />, { wrapper });
    expect(getByTestId('export-heading')).toHaveTextContent('Exporting records 1 of 10 (total: 10)');
  });

  it.todo('shows the correct output');
  it('single mode removes limiter and submit button', () => {
    const { getByTestId } = render(<SingleMode />, { wrapper });
    expect(() => getByTestId('export-submit')).toThrow();
  });
});
