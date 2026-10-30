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
      <path d="M 1.5 10.12 q 2.25 -3 4.5 0 t 4.5 0 t 4.5 0 t 4.5 0" stroke="#0891B2" strokeWidth={1.2} />
      <path d="M 1.5 16.12 q 2.25 -3 4.5 0 t 4.5 0 t 4.5 0 t 4.5 0" stroke="#0891B2" strokeWidth={1.2} />
    </g>
  </svg>
);
export const OceanIcon = forwardRef(icon);
