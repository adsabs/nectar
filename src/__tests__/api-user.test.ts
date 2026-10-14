import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';

import user, { IApiUserResponse } from '@/pages/api/user';

const getIronSessionMock = vi.hoisted(() => vi.fn());

vi.mock('iron-session/edge', () => ({ getIronSession: getIronSessionMock }));

const TOKEN = {
  access_token: 'shared-elevated-bot-token',
  expires_at: `${Math.floor(Date.now() / 1000) + 3600}`,
  username: 'anonymous',
  anonymous: true,
};

const callWith = async (session: Record<string, unknown>) => {
  getIronSessionMock.mockResolvedValue(session);
  const json = vi.fn();
  await user({} as NextApiRequest, { json } as unknown as NextApiResponse);
  return json.mock.calls[0][0] as IApiUserResponse;
};

describe('/api/user', () => {
  beforeEach(() => {
    getIronSessionMock.mockReset();
  });

  test('returns the token for an ordinary session', async () => {
    const body = await callWith({ token: TOKEN, isAuthenticated: true, bot: false });

    expect(body).toEqual({ isAuthenticated: true, user: TOKEN });
  });

  test('withholds a bot token and says so, so the client stops negotiating', async () => {
    const body = await callWith({ token: TOKEN, isAuthenticated: false, bot: true });

    expect(body).toEqual({ isAuthenticated: false, user: undefined, bot: true });
    expect(JSON.stringify(body)).not.toContain('shared-elevated-bot-token');
  });

  test('does not claim bot for an ordinary session', async () => {
    const body = await callWith({ token: TOKEN, isAuthenticated: false });

    expect(body.bot).toBeUndefined();
  });
});
