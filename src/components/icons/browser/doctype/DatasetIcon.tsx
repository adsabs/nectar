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
      <ellipse cx="12" cy="6" rx="6" ry="2.4" stroke="#14B8A6" strokeWidth={1.2} />
      <path d="M 6 6 v 12 c 0 1.35 2.7 2.4 6 2.4 s 6 -1.05 6 -2.4 V 6" stroke="#14B8A6" strokeWidth={1.2} />
      <path d="M 6 12 c 0 1.35 2.7 2.4 6 2.4 s 6 -1.05 6 -2.4" stroke="#14B8A6" strokeWidth={1.2} />
    </g>
  </svg>
);
export const DatasetIcon = forwardRef(icon);
