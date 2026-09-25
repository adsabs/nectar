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
      <path d="M 12 8.62 l 4.12 4.12 l -4.12 4.12 l -4.12 -4.12 z" stroke="#14B8A6" strokeWidth={1.2} />
      <rect x="1.88" y="10.5" width="4.5" height="4.5" rx="0.75" stroke="#14B8A6" strokeWidth={1.2} />
      <rect x="17.62" y="10.5" width="4.5" height="4.5" rx="0.75" stroke="#14B8A6" strokeWidth={1.2} />
      <path d="M 6.38 12.75 h 1.5" stroke="#14B8A6" strokeWidth={1.2} />
      <path d="M 16.12 12.75 h 1.5" stroke="#14B8A6" strokeWidth={1.2} />
      <path d="M 12 8.62 V 4.88" stroke="#14B8A6" strokeWidth={1.2} />
      <path d="M 10.35 6.52 a 2.4 2.4 0 0 1 3.3 0" stroke="#14B8A6" strokeWidth={1.2} />
    </g>
  </svg>
);
export const EarthObservationIcon = forwardRef(icon);
