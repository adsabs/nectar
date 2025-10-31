import { describe, expect, it, vi } from 'vitest';

vi.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/',
    basePath: '',
    isReady: true,
    pathname: '/',
    query: {},
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

vi.mock('@/components/AbstractSideNav', () => ({
  AbstractSideNav: () => <div data-testid="abstract-side-nav" />,
}));

vi.mock('@/components/AbstractSources', () => ({
  AbstractSources: () => <div data-testid="abstract-sources" />,
}));

import { AbsLayout } from '@/components/Layout/AbsLayout';
import { render, screen } from '@/test-utils';

const baseDoc = {
  id: 'test-id',
  bibcode: '2020TEST....1A',
  title: ['Test Document'],
} as const;

describe('AbsLayout', () => {
  it('renders stable structure when doc is unavailable', () => {
    render(
      <AbsLayout doc={null} titleDescription="Testing" label="Example">
        <div data-testid="content">Loading content</div>
      </AbsLayout>,
      {},
    );

    expect(document.getElementById('abstract-subview-content')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders document specific details when doc is provided', () => {
    render(
      <AbsLayout doc={{ ...baseDoc }} titleDescription="Testing" label="Example">
        <div data-testid="content">Loaded content</div>
      </AbsLayout>,
      {},
    );

    expect(screen.getByTestId('abstract-side-nav')).toBeInTheDocument();
    expect(screen.getByTestId('abstract-sources')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
});
