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
        d="M 12 2.25 l 6.75 2.62 v 6 c 0 4.5 -3 7.12 -6.75 9 c -3.75 -1.88 -6.75 -4.5 -6.75 -9 v -6 z"
        stroke="#16A34A"
        strokeWidth={1.2}
      />
      <path d="M 7.12 15 l 3 -4.88 l 2.25 3 l 1.65 -2.1 l 2.47 3.97" stroke="#16A34A" strokeWidth={1.2} />
    </g>
  </svg>
);
export const ShieldIcon = forwardRef(icon);
