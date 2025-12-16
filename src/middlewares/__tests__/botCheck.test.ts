import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { botCheck } from '@/middlewares/botCheck';
import { getIronSession } from 'iron-session/edge';

vi.mock('iron-session/edge', async (orig) => {
  const actual = await orig<typeof import('iron-session/edge')>();
  return { ...actual, getIronSession: vi.fn() };
});

describe('botCheck', () => {
  type IronSessionMock = {
    token?: {
      access_token: string;
      expires_at: string;
      username: string;
      anonymous: boolean;
    } | null;
    apiCookieHash?: string;
    isAuthenticated?: boolean;
    bot?: boolean;
    save: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    updateConfig: ReturnType<typeof vi.fn>;
  };

  const getIronSessionMock = getIronSession as unknown as ReturnType<typeof vi.fn<[], Promise<IronSessionMock>>>;
  const baseEnv = { ...process.env };

  beforeEach(() => {
    process.env.VERIFIED_BOTS_ACCESS_TOKEN = 'bot-token';
    process.env.UNVERIFIABLE_BOTS_ACCESS_TOKEN = 'unverifiable-token';
    process.env.MALICIOUS_BOTS_ACCESS_TOKEN = 'malicious-token';
    vi.clearAllMocks();
    getIronSessionMock.mockResolvedValue({
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
  });

  afterEach(() => {
    process.env = { ...baseEnv };
    vi.clearAllMocks();
  });

  const makeReq = (ipHeader?: string, ua?: string) =>
    new NextRequest('https://example.com/search', {
      headers: {
        ...(ipHeader ? { 'x-forwarded-for': ipHeader } : {}),
        ...(ua ? { 'user-agent': ua } : {}),
      },
    });

  const mockCrawlerResponse = (result: number) =>
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }) as unknown as Response,
    );

  it('marks verified bot with bot token and clears apiCookieHash', async () => {
    mockCrawlerResponse(0); // BOT
    const session = await getIronSessionMock();
    const req = makeReq('1.1.1.1', 'TestUA');
    await botCheck(req, NextResponse.next());

    expect(session.token?.access_token).toBe('bot-token');
    expect(session.bot).toBe(true);
    expect(session.apiCookieHash).toBe('');
    expect(session.isAuthenticated).toBe(false);
    expect(session.save).toHaveBeenCalled();
  });

  it('marks unverifiable bot with dedicated token', async () => {
    mockCrawlerResponse(3); // UNVERIFIABLE
    const session = await getIronSessionMock();
    await botCheck(makeReq(), NextResponse.next());

    expect(session.token?.access_token).toBe('unverifiable-token');
    expect(session.bot).toBe(true);
  });

  it('marks malicious bot with dedicated token', async () => {
    mockCrawlerResponse(2); // POTENTIAL_MALICIOUS_BOT
    const session = await getIronSessionMock();
    await botCheck(makeReq(), NextResponse.next());

    expect(session.token?.access_token).toBe('malicious-token');
    expect(session.bot).toBe(true);
  });

  it('does nothing for human responses', async () => {
    mockCrawlerResponse(1); // HUMAN
    const session = await getIronSessionMock();
    await botCheck(makeReq(), NextResponse.next());

    expect(session.token).toBeUndefined();
    expect(session.bot).toBeUndefined();
    expect(session.save).not.toHaveBeenCalled();
  });

  it('treats fetch failure as human to avoid blocking users', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const session = await getIronSessionMock();
    await botCheck(makeReq(), NextResponse.next());

    expect(session.token).toBeUndefined();
    expect(session.save).not.toHaveBeenCalled();
  });
});
