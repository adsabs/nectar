/**
 * @see https://uibakery.io/regex-library/url
 */
const URL_REGEX =
  /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

export const isValidURL = (url: string): boolean => {
  return URL_REGEX.test(url);
};
