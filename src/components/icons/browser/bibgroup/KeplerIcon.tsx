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
        d="M 8.25 3.75 c 0.45 2.85 1.58 3.97 4.43 4.43 c -2.85 0.45 -3.97 1.58 -4.43 4.43 c -0.45 -2.85 -1.58 -3.97 -4.43 -4.43 c 2.85 -0.45 3.97 -1.58 4.43 -4.43 z"
        stroke="#6D28D9"
        strokeWidth={1.2}
      />
      <circle cx="16.12" cy="15.38" r="3" stroke="#6D28D9" strokeWidth={1.2} />
      <path
        d="M 16.88 4.12 c 0.22 1.35 0.75 1.88 2.1 2.1 c -1.35 0.22 -1.88 0.75 -2.1 2.1 c -0.22 -1.35 -0.75 -1.88 -2.1 -2.1 c 1.35 -0.22 1.88 -0.75 2.1 -2.1 z"
        stroke="#6D28D9"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const KeplerIcon = forwardRef(icon);
