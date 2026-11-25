const MATH_DELIMITERS = /\$|\\\(|\\\[/;

export const containsMath = (value: string | undefined | null): boolean =>
  typeof value === 'string' && MATH_DELIMITERS.test(value);
