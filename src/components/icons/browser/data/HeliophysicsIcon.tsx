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
      <circle cx="12" cy="12" r="4.5" stroke="#EAB308" strokeWidth={1.2} />
      <path
        d="M 12 4.12 V 6 M 12 18 v 1.88 M 4.12 12 H 6 M 18 12 h 1.88 M 6.45 6.45 l 1.35 1.35 M 16.2 16.2 l -1.35 -1.35 M 17.55 6.45 l -1.35 1.35 M 7.8 16.2 l 1.35 -1.35"
        stroke="#EAB308"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const HeliophysicsIcon = forwardRef(icon);
