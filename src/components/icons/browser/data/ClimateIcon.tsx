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
      <path
        d="M 6.38 18 h 8.25 a 3.38 3.38 0 0 0 0.68 -6.68 A 4.88 4.88 0 0 0 5.78 10.5 A 3.6 3.6 0 0 0 6.38 18 z"
        stroke="#0EA5E9"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const ClimateIcon = forwardRef(icon);
