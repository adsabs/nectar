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
        d="M 12 3 c 0.68 4.12 2.25 5.7 6.38 6.38 c -4.12 0.68 -5.7 2.25 -6.38 6.38 c -0.68 -4.12 -2.25 -5.7 -6.38 -6.38 c 4.12 -0.68 5.7 -2.25 6.38 -6.38 z"
        stroke="#E11D48"
        strokeWidth={1.2}
      />
      <path
        d="M 18.75 5.25 l 1.2 1.2 M 5.25 18.75 l -1.2 -1.2 M 18.75 18.75 l -1.2 -1.2 M 5.25 5.25 l 1.2 1.2"
        stroke="#E11D48"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const XrayIcon = forwardRef(icon);
