import { parseIp } from '@/middlewares/cidr';

export const MAX_PTR_RECORDS = 5;

const sameAddress = (a: Uint8Array | null, b: Uint8Array): boolean =>
  a !== null && a.length === b.length && a.every((byte, index) => byte === b[index]);

export interface ReverseDnsLookups {
  lookupPtr: (ip: string) => Promise<readonly string[]>;
  lookupAddresses: (hostname: string, family: 'A' | 'AAAA') => Promise<readonly string[]>;
}

const normalizeHostname = (hostname: string) => hostname.toLowerCase().replace(/\.$/, '');

export const isSubdomainOf = (hostname: string, domain: string): boolean => {
  const hostLabels = normalizeHostname(hostname).split('.').reverse();
  const domainLabels = normalizeHostname(domain).split('.').reverse();

  if (hostLabels.length < domainLabels.length) {
    return false;
  }

  return domainLabels.every((label, index) => hostLabels[index] === label);
};

export const verifyReverseDns = async (
  remoteIp: string,
  domains: readonly string[],
  { lookupPtr, lookupAddresses }: ReverseDnsLookups,
): Promise<boolean> => {
  if (typeof remoteIp !== 'string' || remoteIp.length === 0) {
    return false;
  }

  const expected = parseIp(remoteIp);
  if (expected === null) {
    return false;
  }

  let ptrRecords: readonly string[];
  try {
    ptrRecords = await lookupPtr(remoteIp);
  } catch {
    return false;
  }

  const family = expected.length === 4 ? 'A' : 'AAAA';

  for (const hostname of ptrRecords.slice(0, MAX_PTR_RECORDS)) {
    if (!domains.some((domain) => isSubdomainOf(hostname, domain))) {
      continue;
    }

    try {
      const addresses = await lookupAddresses(hostname, family);
      if (addresses.some((address) => sameAddress(parseIp(address), expected))) {
        return true;
      }
    } catch {}
  }

  return false;
};
