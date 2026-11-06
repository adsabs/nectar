import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { copyToClipboard } from './clipboard';

type Representations = Record<string, Promise<Blob>>;

const recorded: Representations[] = [];

class ClipboardItemStub {
  public readonly types: string[];

  constructor(public readonly representations: Representations) {
    this.types = Object.keys(representations);
    recorded.push(representations);
  }
}

const readBlob = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('could not read blob'));
    reader.readAsText(blob);
  });

const readRepresentation = async (index: number, type: string): Promise<string> => {
  const blob = await recorded[index][type];
  return readBlob(blob);
};

let write: ReturnType<typeof vi.fn>;
let writeText: ReturnType<typeof vi.fn>;

const installClipboard = ({ withClipboardItem = true, withWrite = true } = {}) => {
  write = vi.fn().mockResolvedValue(undefined);
  writeText = vi.fn().mockResolvedValue(undefined);

  Object.defineProperty(navigator, 'clipboard', {
    value: withWrite ? { write, writeText } : { writeText },
    configurable: true,
    writable: true,
  });

  if (withClipboardItem) {
    (globalThis as Record<string, unknown>).ClipboardItem = ClipboardItemStub;
  } else {
    delete (globalThis as Record<string, unknown>).ClipboardItem;
  }
};

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  recorded.length = 0;
  installClipboard();
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).ClipboardItem;
  Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true, writable: true });
  vi.restoreAllMocks();
});

describe('copyToClipboard', () => {
  describe('representations (criterion 9)', () => {
    it('supplies only text/plain for a plain-text format', async () => {
      await copyToClipboard({ content: '@ARTICLE{2003NanoL}', asHtml: false });

      expect(write).toHaveBeenCalledTimes(1);
      expect(recorded).toHaveLength(1);
      expect(Object.keys(recorded[0])).toEqual(['text/plain']);
      await expect(readRepresentation(0, 'text/plain')).resolves.toBe('@ARTICLE{2003NanoL}');
    });

    it('supplies both text/html and text/plain for an HTML format', async () => {
      await copyToClipboard({ content: 'Star, A., <i>Nano Letters</i>', asHtml: true });

      expect(Object.keys(recorded[0]).sort()).toEqual(['text/html', 'text/plain']);
    });

    it('keeps the markup in the text/html representation', async () => {
      await copyToClipboard({ content: 'Star, A., <i>Nano Letters</i>', asHtml: true });

      await expect(readRepresentation(0, 'text/html')).resolves.toBe('Star, A., <i>Nano Letters</i>');
    });

    it('strips markup from the text/plain representation of an HTML format', async () => {
      await copyToClipboard({ content: 'Star, A., <i>Nano Letters</i>, <b>3</b>, 459', asHtml: true });

      await expect(readRepresentation(0, 'text/plain')).resolves.toBe('Star, A., Nano Letters, 3, 459');
    });

    it('does not strip angle brackets from a plain-text format', async () => {
      await copyToClipboard({ content: 'a < b and c > d', asHtml: false });

      await expect(readRepresentation(0, 'text/plain')).resolves.toBe('a < b and c > d');
    });

    it('tags each blob with its own mime type', async () => {
      await copyToClipboard({ content: '<i>x</i>', asHtml: true });

      await expect(recorded[0]['text/html'].then((b) => b.type)).resolves.toBe('text/html');
      await expect(recorded[0]['text/plain'].then((b) => b.type)).resolves.toBe('text/plain');
    });
  });

  describe('transient user activation (criterion 12a)', () => {
    it('calls write before the content promise resolves', async () => {
      const content = deferred<string>();

      const copy = copyToClipboard({ content: content.promise, asHtml: false });

      expect(write).toHaveBeenCalledTimes(1);

      content.resolve('resolved later');
      await copy;

      await expect(readRepresentation(0, 'text/plain')).resolves.toBe('resolved later');
    });

    it('constructs the clipboard item before the content promise resolves', async () => {
      const content = deferred<string>();

      const copy = copyToClipboard({ content: content.promise, asHtml: true });

      expect(recorded).toHaveLength(1);
      expect(Object.keys(recorded[0]).sort()).toEqual(['text/html', 'text/plain']);

      content.resolve('<i>late</i>');
      await copy;
    });

    it('rejects when the content promise rejects, without relying on write to notice', async () => {
      const content = deferred<string>();

      const copy = copyToClipboard({ content: content.promise, asHtml: false });
      content.reject(new Error('export failed'));

      await expect(copy).rejects.toThrow('export failed');
      expect(write).toHaveBeenCalledTimes(1);
    });
  });

  describe('a write the browser rejects (criterion 13)', () => {
    it('rejects rather than resolving', async () => {
      write.mockRejectedValue(new Error('NotAllowedError'));

      await expect(copyToClipboard({ content: 'x', asHtml: false })).rejects.toThrow('NotAllowedError');
    });

    it('rejects for an HTML format too', async () => {
      write.mockRejectedValue(new Error('NotAllowedError'));

      await expect(copyToClipboard({ content: '<i>x</i>', asHtml: true })).rejects.toThrow('NotAllowedError');
    });

    it('rejects when the clipboard api is entirely absent', async () => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true, writable: true });

      await expect(copyToClipboard({ content: 'x', asHtml: false })).rejects.toThrow();
    });
  });

  describe('a write that throws synchronously', () => {
    it('rejects instead of throwing when write throws', async () => {
      write.mockImplementation(() => {
        throw new Error('NotAllowedError');
      });

      await expect(copyToClipboard({ content: 'x', asHtml: false })).rejects.toThrow('NotAllowedError');
    });

    it('rejects instead of throwing when the ClipboardItem constructor throws', async () => {
      (globalThis as Record<string, unknown>).ClipboardItem = class {
        constructor() {
          throw new Error('unsupported representation');
        }
      };

      await expect(copyToClipboard({ content: 'x', asHtml: true })).rejects.toThrow('unsupported representation');
    });

    it('does not throw synchronously out of the call', () => {
      write.mockImplementation(() => {
        throw new Error('NotAllowedError');
      });

      let thrown: unknown = null;
      let returned: Promise<void> | undefined;
      try {
        returned = copyToClipboard({ content: 'x', asHtml: false });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeNull();
      expect(returned).toBeInstanceOf(Promise);
      return expect(returned).rejects.toThrow('NotAllowedError');
    });

    it('leaves no unhandled rejection on the orphaned content promise', async () => {
      write.mockImplementation(() => {
        throw new Error('NotAllowedError');
      });
      const content = deferred<string>();

      const copy = copyToClipboard({ content: content.promise, asHtml: false });
      content.reject(new Error('export failed'));

      await expect(copy).rejects.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  });

  describe('content that is neither a string nor a promise (panel finding 4)', () => {
    it('does not throw synchronously for undefined content', () => {
      expect(() => copyToClipboard({ content: undefined, asHtml: false })).not.toThrow();
    });

    it('does not reject for undefined content', async () => {
      await expect(copyToClipboard({ content: undefined, asHtml: false })).resolves.toBeUndefined();
    });

    it('writes an empty string rather than the literal "undefined"', async () => {
      await copyToClipboard({ content: undefined, asHtml: false });

      await expect(readRepresentation(0, 'text/plain')).resolves.toBe('');
    });
  });

  describe('fallback when ClipboardItem is unavailable', () => {
    it('falls back to writeText', async () => {
      installClipboard({ withClipboardItem: false });

      await copyToClipboard({ content: 'plain citation', asHtml: false });

      expect(writeText).toHaveBeenCalledWith('plain citation');
      expect(recorded).toHaveLength(0);
    });

    it('falls back to writeText when write is missing', async () => {
      installClipboard({ withWrite: false });

      await copyToClipboard({ content: 'plain citation', asHtml: false });

      expect(writeText).toHaveBeenCalledWith('plain citation');
    });

    it('strips markup in the writeText fallback for an HTML format', async () => {
      installClipboard({ withClipboardItem: false });

      await copyToClipboard({ content: 'Star, <i>Nano</i>', asHtml: true });

      expect(writeText).toHaveBeenCalledWith('Star, Nano');
    });

    it('awaits promise content before falling back to writeText', async () => {
      installClipboard({ withClipboardItem: false });
      const content = deferred<string>();

      const copy = copyToClipboard({ content: content.promise, asHtml: false });
      expect(writeText).not.toHaveBeenCalled();

      content.resolve('late plain');
      await copy;

      expect(writeText).toHaveBeenCalledWith('late plain');
    });

    it('rejects when the writeText fallback rejects', async () => {
      installClipboard({ withClipboardItem: false });
      writeText.mockRejectedValue(new Error('NotAllowedError'));

      await expect(copyToClipboard({ content: 'x', asHtml: false })).rejects.toThrow('NotAllowedError');
    });
  });
});
