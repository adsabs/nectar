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
      <rect x="3.75" y="9.75" width="9.75" height="4.5" rx="2.25" stroke="#4F46E5" strokeWidth={1.2} />
      <circle cx="16.12" cy="12" r="2.25" stroke="#4F46E5" strokeWidth={1.2} />
      <path d="M 8.25 14.25 v 2.25" stroke="#4F46E5" strokeWidth={1.2} />
      <rect x="4.5" y="16.5" width="7.5" height="3.38" rx="0.75" stroke="#4F46E5" strokeWidth={1.2} />
      <path d="M 6.38 9.75 V 6.75" stroke="#4F46E5" strokeWidth={1.2} />
      <circle cx="6.38" cy="5.47" r="0.9" stroke="#4F46E5" strokeWidth={1.2} />
    </g>
  </svg>
);
export const SpaceTelescopeIcon = forwardRef(icon);
