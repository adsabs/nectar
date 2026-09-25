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
      <circle cx="12" cy="12" r="7.5" stroke="#57534E" strokeWidth={1.2} />
      <path d="M 12 7.12 V 12 l 3.38 2.25" stroke="#57534E" strokeWidth={1.2} />
      <path
        d="M 12 5.1 v 1.35 M 12 17.55 v -1.35 M 5.1 12 h 1.35 M 17.55 12 h -1.35"
        stroke="#57534E"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const ClockIcon = forwardRef(icon);
