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
      <path d="M 4.5 15.75 a 7.5 7.5 0 0 1 15 0" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 3 15.75 h 18" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 12 8.25 v 7.5" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 6 15.75 v 3.75" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 18 15.75 v 3.75" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 4.5 19.5 h 15" stroke="#64748B" strokeWidth={1.2} />
    </g>
  </svg>
);
export const DomeIcon = forwardRef(icon);
