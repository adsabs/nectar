import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AbsLayout } from '@/components/Layout/AbsLayout';
import { render, screen } from '@/test-utils';

vi.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/',
    basePath: '',
    isFallback: false,
    isReady: true,
    pathname: '/',
    query: {},
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  }),
}));

vi.mock('@/components/Metatags', () => ({ Metatags: () => null }));
vi.mock('@/components/AbstractSources', () => ({ AbstractSources: () => null }));
vi.mock('@/components/AbstractSideNav', () => ({ AbstractSideNav: () => null }));

const baseDoc = {
  id: 'test-id',
  bibcode: '2020TEST....1A',
  title: ['Test Document'],
} as const;

describe('AbsLayout', () => {
  beforeEach(() => {
    document.title = '';
  });

  it('renders stable structure when doc is unavailable', () => {
    render(
      <AbsLayout doc={null} titleDescription="Testing" label="Example">
        <div data-testid="content">Loading content</div>
      </AbsLayout>,
    );

    expect(document.getElementById('abstract-subview-content')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders document specific details when doc is provided', () => {
    render(
      <AbsLayout doc={{ ...baseDoc }} titleDescription="Testing" label="Example">
        <div data-testid="content">Loaded content</div>
      </AbsLayout>,
    );

    expect(document.getElementById('abstract-subview-content')).toBeInTheDocument();
    expect(screen.getByText('Loaded content')).toBeInTheDocument();
    expect(document.querySelector('#abstract-subview-title')?.textContent).toContain(baseDoc.title[0]);
  });
});
