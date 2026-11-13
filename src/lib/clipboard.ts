export interface CopyToClipboardInput {
  content: string | Promise<string>;
  asHtml: boolean;
}

const isPromiseLike = (value: unknown): value is Promise<string> =>
  typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function';

const toPromise = (content: string | Promise<string>): Promise<string> => {
  if (typeof content === 'string') {
    return Promise.resolve(content);
  }
  if (isPromiseLike(content)) {
    return content;
  }
  return Promise.resolve('');
};

const stripMarkup = (value: string, asHtml: boolean): string => (asHtml ? value.replace(/<[^>]+>/g, '') : value);

const toBlobPromise = (source: Promise<string>, type: string, transform: (value: string) => string): Promise<Blob> => {
  const blobPromise = source.then((value) => new Blob([transform(value)], { type }));
  blobPromise.catch((): void => undefined);
  return blobPromise;
};

const buildRepresentations = (contentPromise: Promise<string>, asHtml: boolean): Record<string, Promise<Blob>> => {
  const representations: Record<string, Promise<Blob>> = {
    'text/plain': toBlobPromise(contentPromise, 'text/plain', (value) => stripMarkup(value, asHtml)),
  };

  if (asHtml) {
    representations['text/html'] = toBlobPromise(contentPromise, 'text/html', (value) => value);
  }

  return representations;
};

export const copyToClipboard = (input: CopyToClipboardInput): Promise<void> => {
  const { content, asHtml } = input;

  if (!navigator.clipboard) {
    if (typeof content !== 'string') {
      content.catch((): void => undefined);
    }
    return Promise.reject(new Error('Clipboard API is unavailable'));
  }

  const { clipboard } = navigator;
  const contentPromise = toPromise(content);
  const supportsClipboardItem = typeof ClipboardItem !== 'undefined' && typeof clipboard.write === 'function';

  if (!supportsClipboardItem) {
    return contentPromise.then((value) => clipboard.writeText(stripMarkup(value, asHtml)));
  }

  try {
    const representations = buildRepresentations(contentPromise, asHtml);
    const writePromise = clipboard.write([new ClipboardItem(representations)]);
    return Promise.all([writePromise, contentPromise]).then((): void => undefined);
  } catch (error) {
    contentPromise.catch((): void => undefined);
    return Promise.reject(error);
  }
};
