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
      <rect x="8.25" y="3" width="11.25" height="14.25" rx="1.5" stroke="#4F46E5" strokeWidth={1.2} />
      <rect x="4.5" y="6.75" width="11.25" height="14.25" rx="1.5" fill="#ffffff" stroke="#4F46E5" strokeWidth={1.2} />
    </g>
  </svg>
);
export const ProceedingsIcon = forwardRef(icon);
