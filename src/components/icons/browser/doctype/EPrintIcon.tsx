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
        stroke="#22A06B"
        strokeWidth={1.2}
      />
      <path d="M 14.25 2.25 v 4.5 h 4.5" stroke="#22A06B" strokeWidth={1.2} />
      <path
        d="M 8.62 15.38 a 2.4 2.4 0 0 1 0.38 -4.72 a 3.15 3.15 0 0 1 6.07 0.9 a 2.17 2.17 0 0 1 -0.45 3.82 z"
        stroke="#22A06B"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const EPrintIcon = forwardRef(icon);
