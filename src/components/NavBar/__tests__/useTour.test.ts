import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTour } from '../useTour';

const sendGTMEvent = vi.fn();
vi.mock('@next/third-parties/google', () => ({
  sendGTMEvent: (...args: unknown[]) => sendGTMEvent(...args),
}));

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/', asPath: '/', query: {}, push: vi.fn() }),
}));

vi.mock('@chakra-ui/react', () => ({
  useBreakpointValue: () => false,
}));

vi.mock('@/store', () => ({
  useStore: (selector: (state: { mode: string; searchMode: string }) => unknown) =>
    selector({ mode: 'ASTROPHYSICS', searchMode: 'SCIX' }),
}));

type Handler = () => void;

let handlers: Record<string, Handler>;
let currentStep: { id: string } | undefined;

class FakeTour {
  public options: Record<string, unknown> = {};

  public get currentStep() {
    return currentStep;
  }

  public addSteps() {
    return this;
  }

  public on(event: string, handler: Handler) {
    handlers[event] = handler;
  }

  public cancel() {
    handlers.cancel?.();
  }
}

vi.mock('react-shepherd', () => ({
  useShepherd: () => ({ Tour: FakeTour }),
}));

const renderTour = () => {
  handlers = {};
  return renderHook(() => useTour('home'));
};

afterEach(() => {
  sendGTMEvent.mockReset();
  currentStep = undefined;
});

describe('useTour cancel analytics', () => {
  test('cancelling with no current step sends an explicit null step_id, which is what clears GTM', () => {
    currentStep = undefined;
    renderTour();

    handlers.cancel?.();

    const payload = sendGTMEvent.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(payload).toHaveProperty('step_id');
    expect(payload.step_id).toBeNull();
    expect(payload).toStrictEqual({ event: 'tour_cancel', tour_type: 'home', step_id: null });
  });

  test('cancelling on a step reports that step, not null', () => {
    currentStep = { id: 'welcome' };
    renderTour();

    handlers.cancel?.();

    expect(sendGTMEvent).toHaveBeenLastCalledWith({
      event: 'tour_cancel',
      tour_type: 'home',
      step_id: 'welcome',
    });
  });

  test('a cancel after a step never omits step_id, since omission leaves GTM holding the old value', () => {
    currentStep = { id: 'facets' };
    renderTour();
    handlers.show?.();

    currentStep = undefined;
    handlers.cancel?.();

    const payload = sendGTMEvent.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(payload).toHaveProperty('step_id');
    expect(payload.step_id).toBeNull();
  });
});
