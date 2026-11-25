import { render } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const recaptcha = vi.hoisted(() => ({
  providerRenders: 0,
  hookCalls: 0,
  hookSawProvider: [] as boolean[],
}));

vi.mock('react-google-recaptcha-v3', async () => {
  const React = await import('react');
  const UnderProvider = React.createContext(false);

  return {
    GoogleReCaptchaProvider: ({ children }: { children: React.ReactNode }) => {
      recaptcha.providerRenders += 1;
      return React.createElement(UnderProvider.Provider, { value: true }, children);
    },
    useGoogleReCaptcha: () => {
      const isUnderProvider = React.useContext(UnderProvider);
      recaptcha.hookCalls += 1;
      recaptcha.hookSawProvider.push(isUnderProvider);
      return { executeRecaptcha: () => Promise.resolve('test-token') };
    },
  };
});

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/', query: {}, asPath: '/', push: vi.fn(), events: { on: vi.fn(), off: vi.fn() } }),
}));

vi.mock('@/lib/useGetUserEmail', () => ({ useGetUserEmail: () => '' }));

vi.mock('@/components/Layout', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/Layout')>();
  return { ...actual, FeedbackLayout: ({ children }: { children: unknown }) => children };
});

vi.mock('@/components/FeedbackForms', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/FeedbackForms')>();
  const OpenPreview = () => (
    <actual.PreviewModal
      params={{} as never}
      isOpen
      title="preview"
      submitterInfo=""
      mainContentTitle=""
      mainContent=""
      onClose={() => undefined}
      onSuccess={() => undefined}
      onError={() => undefined}
    />
  );
  return {
    ...actual,
    RecordPanel: OpenPreview,
    AssociatedArticlesForm: OpenPreview,
    MissingReferenceForm: OpenPreview,
  };
});

Element.prototype.scrollIntoView = vi.fn();
Object.defineProperty(HTMLElement.prototype, 'focus', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

const PAGE_RENDER_TIMEOUT_MS = 30_000;

const reset = () => {
  recaptcha.providerRenders = 0;
  recaptcha.hookCalls = 0;
  recaptcha.hookSawProvider = [];
};

describe('every reCAPTCHA consumer sits under a provider (criterion 3)', () => {
  beforeEach(reset);

  describe.each([
    ['/user/account/forgotpassword', () => import('@/pages/user/account/forgotpassword')],
    ['/user/account/register', () => import('@/pages/user/account/register')],
    ['/feedback/general', () => import('@/pages/feedback/general')],
  ])('%s calls the hook under a provider', (_route, load) => {
    test(
      'the provider has already rendered when the hook runs',
      async () => {
        const mod = await load();
        const Page = mod.default as () => JSX.Element;

        render(<Page />);

        expect(recaptcha.hookCalls, 'the page never called useGoogleReCaptcha').toBeGreaterThan(0);
        expect(recaptcha.hookSawProvider).not.toContain(false);
      },
      PAGE_RENDER_TIMEOUT_MS,
    );
  });

  describe.each([
    ['/feedback/missingrecord', () => import('@/pages/feedback/missingrecord')],
    ['/feedback/associatedarticles', () => import('@/pages/feedback/associatedarticles')],
    ['/feedback/missingreferences', () => import('@/pages/feedback/missingreferences')],
  ])('%s reaches PreviewModal under a provider', (_route, load) => {
    test(
      'the provider has already rendered when PreviewModal calls the hook',
      async () => {
        const mod = await load();
        const Page = mod.default as () => JSX.Element;

        render(<Page />);

        expect(recaptcha.hookCalls, 'PreviewModal never called useGoogleReCaptcha').toBeGreaterThan(0);
        expect(recaptcha.hookSawProvider).not.toContain(false);
      },
      PAGE_RENDER_TIMEOUT_MS,
    );
  });
});
