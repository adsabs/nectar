export const stripNotifyParam = (path: string) => {
  const url = new URL(path, 'http://localhost');
  if (!url.searchParams.has('notify')) {
    return path;
  }
  url.searchParams.delete('notify');
  return `${url.pathname}${url.search}${url.hash}`;
};
