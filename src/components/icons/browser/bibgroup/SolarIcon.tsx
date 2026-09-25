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
      <circle cx="12" cy="12" r="5.25" stroke="#F59E0B" strokeWidth={1.2} />
      <path
        d="M 12 3 v 1.88 M 12 19.12 V 21 M 3 12 h 1.88 M 19.12 12 H 21 M 5.62 5.62 l 1.35 1.35 M 17.02 17.02 l -1.35 -1.35 M 18.38 5.62 l -1.35 1.35 M 6.98 17.02 l 1.35 -1.35"
        stroke="#F59E0B"
        strokeWidth={1.2}
      />
      <path d="M 16.95 9.6 c 2.1 -0.22 2.4 2.7 0.3 3.3" stroke="#F59E0B" strokeWidth={1.2} />
    </g>
  </svg>
);
export const SolarIcon = forwardRef(icon);
