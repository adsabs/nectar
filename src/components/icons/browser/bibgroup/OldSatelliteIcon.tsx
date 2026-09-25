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
      <rect x="9" y="9" width="6" height="6" rx="0.75" stroke="#9A3412" strokeWidth={1.2} />
      <rect x="2.25" y="10.12" width="5.25" height="3.75" rx="0.75" stroke="#9A3412" strokeWidth={1.2} />
      <rect x="16.5" y="10.12" width="5.25" height="3.75" rx="0.75" stroke="#9A3412" strokeWidth={1.2} />
      <path d="M 12 9 V 3.75" stroke="#9A3412" strokeWidth={1.2} />
      <path d="M 9.75 3.75 h 4.5" stroke="#9A3412" strokeWidth={1.2} />
    </g>
  </svg>
);
export const OldSatelliteIcon = forwardRef(icon);
