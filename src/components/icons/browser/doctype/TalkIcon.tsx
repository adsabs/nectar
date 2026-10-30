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
        d="M 3.75 5.25 a 1.5 1.5 0 0 1 1.5 -1.5 h 13.5 a 1.5 1.5 0 0 1 1.5 1.5 v 8.25 a 1.5 1.5 0 0 1 -1.5 1.5 H 10.5 l -4.5 3.75 v -3.75 H 5.25 a 1.5 1.5 0 0 1 -1.5 -1.5 z"
        stroke="#65A30D"
        strokeWidth={1.2}
      />
      <circle cx="8.62" cy="9.38" r="1.12" fill="#65A30D" />
      <circle cx="12" cy="9.38" r="1.12" fill="#65A30D" />
      <circle cx="15.38" cy="9.38" r="1.12" fill="#65A30D" />
    </g>
  </svg>
);
export const TalkIcon = forwardRef(icon);
