import { forwardRef, Ref, SVGProps } from 'react';
const icon = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg
    width="64px"
    height="64px"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    ref={ref}
    {...props}
  >
    <g id="SVGRepo_bgCarrier" strokeWidth={0} />
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
    <g id="SVGRepo_iconCarrier">
      <path
        d="M 6.75 2.25 h 7.5 l 4.5 4.5 v 13.5 a 1.5 1.5 0 0 1 -1.5 1.5 H 6.75 a 1.5 1.5 0 0 1 -1.5 -1.5 V 3.75 a 1.5 1.5 0 0 1 1.5 -1.5 z"
        stroke="#06B6D4"
        strokeWidth={1.2}
      />
      <path d="M 14.25 2.25 v 4.5 h 4.5" stroke="#06B6D4" strokeWidth={1.2} />
      <path d="M 12.38 6 v 13.5" stroke="#06B6D4" strokeWidth={1.2} />
      <path
        d="M 12.38 10.12 C 9.38 10.12 8.25 9 8.25 7.73 C 8.25 6.23 9.6 6 12.38 6"
        stroke="#06B6D4"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const AbstractIcon = forwardRef(icon);
