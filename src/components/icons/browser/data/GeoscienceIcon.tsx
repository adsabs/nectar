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
      <circle cx="12" cy="12" r="8.25" stroke="#2563EB" strokeWidth={1.2} />
      <ellipse cx="12" cy="12" rx="3.75" ry="8.25" stroke="#2563EB" strokeWidth={1.2} />
      <path d="M 3.75 12 h 16.5" stroke="#2563EB" strokeWidth={1.2} />
    </g>
  </svg>
);
export const GeoscienceIcon = forwardRef(icon);
