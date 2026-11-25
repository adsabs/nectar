import { render, waitFor } from '@/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LegacyHashRedirect } from './LegacyHashRedirect';
import { LEGACY_REDIRECT_CLASS } from '@/legacy-hash-snippet';

const replace = vi.fn();
const originalLocation = window.location;

const setUrl = (href: string) => {
  const url = new URL(href, 'https://scixplorer.org');
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: {
      href: url.href,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      replace,
    },
  });
};

beforeEach(() => {
  setUrl('/');
});

afterEach(() => {
  document.documentElement.classList.remove(LEGACY_REDIRECT_CLASS);
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: originalLocation,
  });
  vi.clearAllMocks();
});

describe('LegacyHashRedirect', () => {
  test('redirects a legacy abs fragment to the canonical path', async () => {
    setUrl('/?fromADS=true&ads_compat=1#abs/2019ApJ...879...45K/metrics');
    render(<LegacyHashRedirect />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/abs/2019ApJ...879...45K/metrics'));
  });

  test('redirects a legacy search fragment carrying a trailing view', async () => {
    setUrl('/#search/q=star&sort=date%20desc&p_=0/show-metrics');
    render(<LegacyHashRedirect />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/search/metrics?q=star&sort=date+desc&p=1'));
  });

  test('leaves an in-page anchor alone', async () => {
    setUrl('/abs/2019ApJ...879...45K/abstract#abstract-section');
    render(<LegacyHashRedirect />);

    await waitFor(() => expect(replace).not.toHaveBeenCalled());
  });

  test('does nothing when there is no fragment', async () => {
    setUrl('/?fromADS=true');
    render(<LegacyHashRedirect />);

    await waitFor(() => expect(replace).not.toHaveBeenCalled());
  });

  test('reveals the page when the fragment is not a legacy route', async () => {
    document.documentElement.classList.add(LEGACY_REDIRECT_CLASS);
    setUrl('/#results');
    render(<LegacyHashRedirect />);

    await waitFor(() => expect(document.documentElement.classList.contains(LEGACY_REDIRECT_CLASS)).toBe(false));
    expect(replace).not.toHaveBeenCalled();
  });

  test('reveals the page when there is no fragment at all', async () => {
    document.documentElement.classList.add(LEGACY_REDIRECT_CLASS);
    setUrl('/');
    render(<LegacyHashRedirect />);

    await waitFor(() => expect(document.documentElement.classList.contains(LEGACY_REDIRECT_CLASS)).toBe(false));
  });

  test('leaves the overlay up while the redirect is in flight', async () => {
    document.documentElement.classList.add(LEGACY_REDIRECT_CLASS);
    setUrl('/#abs/2016PhRvL.116f1102A/metrics');
    render(<LegacyHashRedirect />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/abs/2016PhRvL.116f1102A/metrics'));
    expect(document.documentElement.classList.contains(LEGACY_REDIRECT_CLASS)).toBe(true);
  });
});
