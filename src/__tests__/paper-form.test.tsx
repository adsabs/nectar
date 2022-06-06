import { handlers } from '@mocks/handlers';
import { IsomorphicResponse } from '@mswjs/interceptors';
import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedRequest } from 'msw';
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

const setup = () => {
  const user = userEvent.setup();
  const onReq = jest.fn<never, Parameters<(req: MockedRequest) => void>>();
  const onRes = jest.fn<never, Parameters<(res: IsomorphicResponse, requestId: string) => void>>();
  server.events.on('request:start', onReq);
  server.events.on('response:mocked', onRes);
  return { onReq, onRes, user, ...render(<PaperForm />, { wrapper }) };
};

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

  test('journal search works', async () => {
    const { getByRole, user } = setup();

    await act(async () => {
      await user.type(getByRole('textbox', { name: /publication/i }), 'TDM');
      await user.keyboard('{ArrowDown}{Enter}');
      await user.keyboard('{Tab}1998{Tab}20{Tab}1{Tab}{Enter}');
    });

    expect(router.push).toBeCalledWith(
      '/search?q=bibstem%3ATDM%20year%3A1998%20volume%3A20%20pageid%3A1&sort=date%20desc%2Cbibcode%20desc&p=1',
    );
  });

  test.todo('reference form works');
  test.todo('bibcode query form works');
  test.todo('error messages show up properly');
});
