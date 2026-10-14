export const BOT_CHECK_SIGNATURE_HEADER = 'x-bot-check-signature';
export const BOT_CHECK_MAX_SKEW_MS = 60_000;

export interface BotCheckPayload {
  ua: string;
  ip: string;
  ts: number;
}

const encoder = new TextEncoder();

const canonical = ({ ts, ip, ua }: BotCheckPayload) => `${ts}\n${ip}\n${ua}`;

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

export const signBotCheck = async (payload: BotCheckPayload, secret: string): Promise<string> => {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  return toHex(await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(canonical(payload))));
};

const equalsConstantTime = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return diff === 0;
};

export const verifyBotCheck = async (
  payload: BotCheckPayload,
  signature: string | undefined,
  secret: string | undefined,
  now: number = Date.now(),
): Promise<boolean> => {
  if (!secret || !signature) {
    return false;
  }

  if (!Number.isFinite(payload.ts) || Math.abs(now - payload.ts) > BOT_CHECK_MAX_SKEW_MS) {
    return false;
  }

  return equalsConstantTime(signature, await signBotCheck(payload, secret));
};
