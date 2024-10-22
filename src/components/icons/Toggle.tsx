import { createIcon } from '@chakra-ui/react';

export const ToggleOnIcon = createIcon({
  displayName: 'ToggleOnIcon',
  viewBox: '0 0 24 24',
  defaultProps: {
    fontSize: '20px',
    fill: 'blue.500',
    color: 'blue.500',
  },
  path: [
    <path key={0} fill="none" d="M0 0h24v24H0z" />,
    <path key={1} d="M8 5h8a7 7 0 0 1 0 14H8A7 7 0 0 1 8 5zm8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  ],
});

export const ToggleOffIcon = createIcon({
  displayName: 'ToggleOffIcon',
  viewBox: '0 0 24 24',
  defaultProps: {
    fontSize: '20px',
    transform: 'rotate(180deg)',
    fillRule: 'evenodd',
    clipRule: 'evenodd',
  },
  path: [
    <path
      key={0}
      d="M17 15C18.6569 15 20 13.6569 20 12C20 10.3431 18.6569 9 17 9C15.3431 9 14 10.3431 14 12C14 13.6569 15.3431 15 17 15Z"
      fill="#000000"
    />,
    <path
      key={1}
      d="M0 12C0 8.13401 3.13401 5 7 5H17C20.866 5 24 8.13401 24 12C24 15.866 20.866 19 17 19H7C3.13401 19 0 15.866 0 12ZM7 7H17C19.7614 7 22 9.23858 22 12C22 14.7614 19.7614 17 17 17H7C4.23858 17 2 14.7614 2 12C2 9.23858 4.23858 7 7 7Z"
      fill="#000000"
    />,
  ],
});
