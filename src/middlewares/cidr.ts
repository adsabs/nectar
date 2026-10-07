const parseIpv4Bytes = (ip: string): Uint8Array | null => {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    return null;
  }

  const bytes = new Uint8Array(4);
  for (let i = 0; i < 4; i += 1) {
    if (!/^\d{1,3}$/.test(parts[i])) {
      return null;
    }
    const octet = Number(parts[i]);
    if (octet > 255) {
      return null;
    }
    bytes[i] = octet;
  }

  return bytes;
};

const parseIpv6Bytes = (ip: string): Uint8Array | null => {
  const halves = ip.split('::');
  if (halves.length > 2) {
    return null;
  }

  const split = (part: string) => (part.length > 0 ? part.split(':') : []);
  const head = split(halves[0]);
  const tail = halves.length === 2 ? split(halves[1]) : [];

  const groups = halves.length === 2 ? tail : head;
  const last = groups[groups.length - 1];
  let trailing: Uint8Array | null = null;
  if (last !== undefined && last.includes('.')) {
    trailing = parseIpv4Bytes(last);
    if (trailing === null) {
      return null;
    }
    groups.pop();
  }

  const groupCount = head.length + tail.length;
  const trailingGroups = trailing === null ? 0 : 2;
  if (halves.length === 2 ? groupCount + trailingGroups > 8 : groupCount + trailingGroups !== 8) {
    return null;
  }

  const bytes = new Uint8Array(16);
  const write = (group: string, offset: number): boolean => {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
      return false;
    }
    const value = parseInt(group, 16);
    bytes[offset] = value >> 8;
    bytes[offset + 1] = value & 0xff;
    return true;
  };

  for (let i = 0; i < head.length; i += 1) {
    if (!write(head[i], i * 2)) {
      return null;
    }
  }

  const tailStart = 16 - trailingGroups * 2 - tail.length * 2;
  for (let i = 0; i < tail.length; i += 1) {
    if (!write(tail[i], tailStart + i * 2)) {
      return null;
    }
  }

  if (trailing !== null) {
    bytes.set(trailing, 12);
  }

  return bytes;
};

const isIpv4Mapped = (bytes: Uint8Array): boolean => {
  for (let i = 0; i < 10; i += 1) {
    if (bytes[i] !== 0) {
      return false;
    }
  }
  return bytes[10] === 0xff && bytes[11] === 0xff;
};

export const parseIp = (ip: string): Uint8Array | null => {
  if (typeof ip !== 'string' || ip.length === 0) {
    return null;
  }

  if (!ip.includes(':')) {
    return parseIpv4Bytes(ip);
  }

  const bytes = parseIpv6Bytes(ip);
  if (bytes === null) {
    return null;
  }

  return isIpv4Mapped(bytes) ? bytes.slice(12) : bytes;
};

export const isIpInCidr = (ip: string, cidr: string): boolean => {
  const slash = cidr.lastIndexOf('/');
  if (slash === -1) {
    return false;
  }

  const network = parseIp(cidr.slice(0, slash));
  const address = parseIp(ip);
  if (network === null || address === null || network.length !== address.length) {
    return false;
  }

  const rawPrefix = cidr.slice(slash + 1);
  if (!/^\d{1,3}$/.test(rawPrefix)) {
    return false;
  }

  const prefixLength = Number(rawPrefix);
  const totalBits = network.length * 8;
  if (prefixLength > totalBits) {
    return false;
  }

  const wholeBytes = prefixLength >> 3;
  for (let i = 0; i < wholeBytes; i += 1) {
    if (address[i] !== network[i]) {
      return false;
    }
  }

  const remainingBits = prefixLength & 7;
  if (remainingBits === 0) {
    return true;
  }

  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (address[wholeBytes] & mask) === (network[wholeBytes] & mask);
};

export const isIpInAnyCidr = (ip: string, cidrs: readonly string[]): boolean =>
  cidrs.some((cidr) => isIpInCidr(ip, cidr));
