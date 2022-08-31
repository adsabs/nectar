import { render } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, test, vi } from 'vitest';
import PaperForm from '../pages/paper-form';

const router = {
  pathname: '/',
  push: vi.fn(),
  asPath: '/',
};
vi.mock('next/router', () => ({
  useRouter: () => router,
}));

const setup = () => {
  const user = userEvent.setup();
  return { user, ...render(<PaperForm />) };
};

describe('Paper Form', () => {
  beforeEach(() => router.push.mockReset());

  test('renders without error', () => {
    render(<PaperForm />);
  });

  test.todo('journal search works');
  test.todo('reference form works');
  test.todo('bibcode query form works');
  test.todo('error messages show up properly');
});
