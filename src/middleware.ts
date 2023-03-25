// eslint-disable-next-line @next/next/no-server-import-in-page
import type { NextRequest } from 'next/server';
// eslint-disable-next-line @next/next/no-server-import-in-page
import { NextResponse } from 'next/server';
import { getIronSession, IronSessionOptions } from 'iron-session/edge';

console.log(process.env);
const cookieConfig: IronSessionOptions = {
  password: process.env.COOKIE_SECRET,
  cookieName: 'scix_session',
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// This function can be marked `async` if using `await` inside
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession(req, res, cookieConfig);

  console.log(req);

  // do anything with session here:
  const { user } = session;

  // like mutate user:
  // user.something = someOtherThing;
  // or:
  // session.user = someoneElse;

  // uncomment next line to commit changes:
  // await session.save();
  // or maybe you want to destroy session:
  // await session.destroy();

  console.log('from middleware', { user });

  return res;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/:path*',
};
