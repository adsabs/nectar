import { composeStories } from '@storybook/testing-react';
import { render } from '@testing-library/react';
import { FC } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import * as stories from '../__stories__/SimpleResultList.stories';

const { Default: ResultList } = composeStories(stories);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
const wrapper: FC = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

describe('ResultList Component', () => {
  test('renders without crashing', () => {
    render(<ResultList docs={[]} />, { wrapper });
  });

  test.todo('synchronizes correctly with URL');
});
