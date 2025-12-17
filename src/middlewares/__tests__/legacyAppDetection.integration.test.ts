import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { legacyAppDetectionMiddleware, isFromLegacyApp } from '@/middlewares/legacyAppDetection';

describe('legacyAppDetectionMiddleware integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const makeSession = (flag = false) => ({
    legacyAppReferrer: flag,
    save: vi.fn(),
    destroy: vi.fn(),
    updateConfig: vi.fn(),
  });

  it('sets legacy flag on first legacy referrer and saves session', async () => {
    const session = makeSession(false);
    const req = new NextRequest('https://example.com/search', {
      headers: { referer: 'https://ui.adsabs.harvard.edu/search' },
    });
    const res = NextResponse.next();

    await legacyAppDetectionMiddleware(req, res, session as never);

    expect(session.legacyAppReferrer).toBe(true);
    expect(session.save).toHaveBeenCalledTimes(1);
  });

  it('does not resave when flag already true on repeated legacy referrer', async () => {
    const session = makeSession(true);
    const req = new NextRequest('https://example.com/search', {
      headers: { referer: 'https://ui.adsabs.harvard.edu/search' },
    });
    const res = NextResponse.next();

    await legacyAppDetectionMiddleware(req, res, session as never);

    expect(session.legacyAppReferrer).toBe(true);
    expect(session.save).not.toHaveBeenCalled();
  });

  it('clears legacy flag on self-referral and saves once', async () => {
    const session = makeSession(true);
    const req = new NextRequest('https://example.com/search', {
      headers: { referer: 'https://example.com/another' },
    });
    const res = NextResponse.next();

    await legacyAppDetectionMiddleware(req, res, session as never);

    expect(session.legacyAppReferrer).toBe(false);
    expect(session.save).toHaveBeenCalledTimes(1);
  });

  it('ignores invalid referer without throwing', async () => {
    const session = makeSession(false);
    const req = new NextRequest('https://example.com/search', { headers: { referer: '::::' } });
    const res = NextResponse.next();

    await expect(legacyAppDetectionMiddleware(req, res, session as never)).resolves.toBeUndefined();
    expect(session.legacyAppReferrer).toBe(false);
    expect(session.save).not.toHaveBeenCalled();
  });
});

describe('isFromLegacyApp integration', () => {
  it('detects legacy domains case-insensitively', () => {
    const req = new NextRequest('https://example.com/search', {
      headers: { referer: 'https://UI.ADSABS.HARVARD.EDU' },
    });
    expect(isFromLegacyApp(req)).toBe(true);
  });

  it('returns false for non-legacy referers', () => {
    const req = new NextRequest('https://example.com/search', { headers: { referer: 'https://google.com' } });
    expect(isFromLegacyApp(req)).toBe(false);
  });
});
