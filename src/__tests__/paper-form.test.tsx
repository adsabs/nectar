import { handlers } from '@mocks/handlers';
import { render } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { FC } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import PaperForm from '../pages/paper-form';

const router = {
  pathname: '/',
  push: jest.fn(),
  asPath: '/',
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

const server = setupServer(...handlers);

describe('Paper Form', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    router.push.mockReset();
    server.resetHandlers();
  });
  afterAll(() => server.close());

  test('renders without error', () => {
    render(<PaperForm />, { wrapper });
  });

  test.todo('journal search works');
  test.todo('reference form works');
  test.todo('bibcode query form works');
  test.todo('error messages show up properly');
});
