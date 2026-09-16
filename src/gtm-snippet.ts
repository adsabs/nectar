import { createHash } from 'node:crypto';
import { isValidToken } from '@/auth-utils';
import { IUserData } from '@/api/user/types';

// SHA-256 hex digest, matching Bumblebee's GA User-ID hash for the same account.
const hashUsername = (username: string): string => createHash('sha256').update(username, 'utf-8').digest('hex');

/**
 * Hashed id for a logged-in session, or null. Server-only — pairs with
 * useTrackUserId, which covers login and logout within a loaded page.
 */
export const getGtmUserId = (user?: IUserData): string | null =>
  isValidToken(user) && !user.anonymous && user.username ? hashUsername(user.username) : null;

// next/script only server-renders at strategy="beforeInteractive" in the
// pages router; any other strategy appends to document.body client-side
// after hydration, which GTM flags as "tag not placed correctly". Inline
// the snippet directly in _document's <Head> instead.
export const getGtmSnippet = (gtmId: string, userId: string | null = null): string => `
  (function(w,d,s,l,i,u){
    w[l]=w[l]||[];
    if(u){w[l].push({user_id:u});}
    w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
    var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;
    j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer',${JSON.stringify(gtmId)},${JSON.stringify(userId)});
`;
