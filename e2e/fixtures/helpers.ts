import { Page, Response } from '@playwright/test';

export const getCookieHeader = (response: Response): string | undefined => {
  const headers = response.headers();
  return headers['set-cookie'];
};

export const parseCookies = (cookieHeader: string): Map<string, string> => {
  const cookies = new Map<string, string>();
  const parts = cookieHeader.split(';').map((part) => part.trim());

  parts.forEach((part, index) => {
    if (index === 0) {
      const [name, value] = part.split('=');
      cookies.set('name', name);
      cookies.set('value', value);
    } else {
      const [key, value] = part.split('=');
      cookies.set(key, value || 'true');
    }
  });

  return cookies;
};

export const extractCookie = (cookieHeader: string | undefined, name: string): string | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = cookieHeader.split(',').map((c) => c.trim());
  const targetCookie = cookies.find((c) => c.startsWith(`${name}=`));

  if (!targetCookie) {
    return undefined;
  }

  return targetCookie;
};

export const getNextData = async (page: Page): Promise<any> => {
  const content = await page.locator('#__NEXT_DATA__').textContent();
  if (!content) {
    throw new Error('__NEXT_DATA__ not found');
  }
  return JSON.parse(content);
};

export const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '127.0.0.1';
  }
};

export type TestScenario =
  | 'bootstrap-authenticated'
  | 'bootstrap-anonymous'
  | 'bootstrap-rotated-cookie'
  | 'bootstrap-unchanged-cookie'
  | 'bootstrap-failure'
  | 'bootstrap-network-error'
  | 'verify-success'
  | 'verify-unknown-token'
  | 'verify-already-validated'
  | 'verify-failure'
  | 'verify-network-error';
