import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSafeStorage,
  isCookiesAvailable,
  isLocalStorageAvailable,
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeSessionStorageGet,
  safeSessionStorageRemove,
  safeSessionStorageSet,
} from '@/lib/browserStorage';

describe('isCookiesAvailable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when navigator.cookieEnabled is false', () => {
    vi.spyOn(navigator, 'cookieEnabled', 'get').mockReturnValue(false);
    expect(isCookiesAvailable()).toBe(false);
  });

  it('returns false when document.cookie access throws SecurityError', () => {
    vi.spyOn(navigator, 'cookieEnabled', 'get').mockReturnValue(true);
    Object.defineProperty(document, 'cookie', {
      get() {
        throw new DOMException('Access denied', 'SecurityError');
      },
      configurable: true,
    });
    expect(isCookiesAvailable()).toBe(false);
    Object.defineProperty(document, 'cookie', {
      get() {
        return '';
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      set() {},
      configurable: true,
    });
  });

  it('returns true when cookies are accessible', () => {
    expect(isCookiesAvailable()).toBe(true);
  });
});

describe('isLocalStorageAvailable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when localStorage.setItem throws SecurityError', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    expect(isLocalStorageAvailable()).toBe(false);
  });

  it('returns true when localStorage probe succeeds', () => {
    expect(isLocalStorageAvailable()).toBe(true);
  });
});

describe('createSafeStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null from getItem when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    const storage = createSafeStorage();
    expect(storage.getItem('key')).toBeNull();
  });

  it('returns stored value from getItem when localStorage works', () => {
    localStorage.setItem('key', 'value');
    const storage = createSafeStorage();
    expect(storage.getItem('key')).toBe('value');
    localStorage.removeItem('key');
  });

  it('does not throw from setItem when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    const storage = createSafeStorage();
    expect(() => storage.setItem('key', 'value')).not.toThrow();
  });

  it('does not throw from removeItem when localStorage.removeItem throws', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    const storage = createSafeStorage();
    expect(() => storage.removeItem?.('key')).not.toThrow();
  });
});

describe('safeLocalStorageGet', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    expect(safeLocalStorageGet('key')).toBeNull();
  });

  it('returns the value when localStorage works', () => {
    localStorage.setItem('key', 'stored');
    expect(safeLocalStorageGet('key')).toBe('stored');
    localStorage.removeItem('key');
  });
});

describe('safeLocalStorageSet', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    expect(() => safeLocalStorageSet('key', 'value')).not.toThrow();
  });
});

describe('safeSessionStorageGet', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when sessionStorage.getItem throws', () => {
    vi.spyOn(window.sessionStorage, 'getItem').mockImplementationOnce(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    expect(safeSessionStorageGet('key')).toBeNull();
  });
});

describe('safeSessionStorageSet', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw when sessionStorage.setItem throws', () => {
    vi.spyOn(window.sessionStorage, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    expect(() => safeSessionStorageSet('key', 'value')).not.toThrow();
  });
});

describe('safeSessionStorageRemove', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not throw when sessionStorage.removeItem throws', () => {
    vi.spyOn(window.sessionStorage, 'removeItem').mockImplementationOnce(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    expect(() => safeSessionStorageRemove('key')).not.toThrow();
  });
});
