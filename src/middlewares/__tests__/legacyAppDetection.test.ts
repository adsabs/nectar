import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { IronSession } from 'iron-session';
import { isFromLegacyApp, legacyAppDetectionMiddleware } from '../legacyAppDetection';

describe('isFromLegacyApp', () => {
  test.concurrent.each<[string, boolean, string]>([
    ['https://ui.adsabs.harvard.edu/search', true, 'legacy app domain'],
    ['https://ui.adsabs.harvard.edu/abs/456', true, 'legacy app with different path'],
    ['https://devui.adsabs.harvard.edu/search', true, 'devui legacy domain'],
    ['https://qa.adsabs.harvard.edu/search', true, 'qa legacy domain'],
    ['https://dev.adsabs.harvard.edu/search', true, 'dev legacy domain'],
    ['https://ui.adsabs.harvard.edu/search?q=test#section', true, 'referer with query parameters and fragments'],
    ['https://ui.adsabs.harvard.edu:443/search', true, 'referer with port numbers'],
    ['https://UI.ADSABS.HARVARD.EDU/search', true, 'referer with uppercase hostname'],
    ['https://google.com', false, 'different domain'],
    ['not-a-valid-url', false, 'invalid URL'],
    ['https://test.ui.adsabs.harvard.edu/search', false, 'subdomain of legacy app'],
    ['https://ui.adsabs.harvard.edu.malicious.com/search', false, 'legacy domain in different domain'],
  ])('should return %s when referer is %s (%s)', (referer, expected) => {
    const req = new NextRequest('https://scixplorer.org/search');
    req.headers.set('referer', referer);

    expect(isFromLegacyApp(req)).toBe(expected);
  });

  test('should return false when referer header is missing', () => {
    const req = new NextRequest('https://scixplorer.org/search');

    expect(isFromLegacyApp(req)).toBe(false);
  });
});

describe('legacyAppDetectionMiddleware', () => {
  let mockSession: IronSession;

  beforeEach(() => {
    mockSession = {
      legacyAppReferrer: false,
      save: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
      updateConfig: vi.fn(),
    } as unknown as IronSession;
  });

  test('should set legacyAppReferrer to true and save session when referer is from legacy app', async () => {
    const req = new NextRequest('https://scixplorer.org/search');
    req.headers.set('referer', 'https://ui.adsabs.harvard.edu/search');
    const res = NextResponse.next();

    await legacyAppDetectionMiddleware(req, res, mockSession);

    expect(mockSession.legacyAppReferrer).toBe(true);
    expect(mockSession.save).toHaveBeenCalledOnce();
  });

  test('should not modify session when referer is not from legacy app', async () => {
    const req = new NextRequest('https://scixplorer.org/search');
    req.headers.set('referer', 'https://google.com');
    const res = NextResponse.next();

    await legacyAppDetectionMiddleware(req, res, mockSession);

    expect(mockSession.legacyAppReferrer).toBe(false);
    expect(mockSession.save).not.toHaveBeenCalled();
  });

  test('should not modify session when referer is missing', async () => {
    const req = new NextRequest('https://scixplorer.org/search');
    const res = NextResponse.next();

    await legacyAppDetectionMiddleware(req, res, mockSession);

    expect(mockSession.legacyAppReferrer).toBe(false);
    expect(mockSession.save).not.toHaveBeenCalled();
  });

  test('should preserve legacyAppReferrer when already true and current referer is not legacy (sticky behavior)', async () => {
    mockSession.legacyAppReferrer = true;
    const req = new NextRequest('https://scixplorer.org/search');
    req.headers.set('referer', 'https://google.com');
    const res = NextResponse.next();

    await legacyAppDetectionMiddleware(req, res, mockSession);

    expect(mockSession.legacyAppReferrer).toBe(true);
    expect(mockSession.save).not.toHaveBeenCalled();
  });

  test('should set legacyAppReferrer to true and save session when referer is from legacy app', async () => {
    mockSession.legacyAppReferrer = false;
    const req = new NextRequest('https://scixplorer.org/search');
    req.headers.set('referer', 'https://ui.adsabs.harvard.edu/search');
    const res = NextResponse.next();

    await legacyAppDetectionMiddleware(req, res, mockSession);

    expect(mockSession.legacyAppReferrer).toBe(true);
    expect(mockSession.save).toHaveBeenCalledOnce();
  });

  test('should not save session when legacyAppReferrer is already true and referer is still from legacy app', async () => {
    mockSession.legacyAppReferrer = true;
    const req = new NextRequest('https://scixplorer.org/search');
    req.headers.set('referer', 'https://ui.adsabs.harvard.edu/search');
    const res = NextResponse.next();

    await legacyAppDetectionMiddleware(req, res, mockSession);

    expect(mockSession.legacyAppReferrer).toBe(true);
    expect(mockSession.save).not.toHaveBeenCalled();
  });
});
