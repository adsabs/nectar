import { unsealData } from 'iron-session';

export const ACCESS_TOKEN_HEADER = 'x-scix-access-token';

export interface ServerSession {
  token?: {
    access_token: string;
    anonymous: boolean;
    expires_at: string;
    username: string;
  };
}

export interface ResolveServerSessionResult {
  session: ServerSession | undefined;
  token: string | undefined;
}

export const resolveServerSession = async (
  rawSession: string | undefined,
  accessTokenHeader: string | null | undefined,
): Promise<ResolveServerSessionResult> => {
  let session: ServerSession | undefined;

  if (rawSession) {
    try {
      session = await unsealData<ServerSession>(rawSession, { password: process.env.COOKIE_SECRET });
    } catch {
      session = undefined;
    }
  }

  const token = session?.token?.access_token ?? accessTokenHeader ?? undefined;

  return { session, token };
};
