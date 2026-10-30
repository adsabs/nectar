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
        d="M 6.75 3.38 A 1.88 1.88 0 0 1 8.62 1.5 H 18 a 0.75 0.75 0 0 1 0.75 0.75 v 16.5 a 0.75 0.75 0 0 1 -0.75 0.75 H 8.62 A 1.88 1.88 0 0 1 6.75 17.62 z"
        stroke="#92400E"
        strokeWidth={1.2}
      />
      <path d="M 9.38 1.5 v 18" stroke="#92400E" strokeWidth={1.2} />
      <path d="M 14.25 1.5 v 5.25 l -1.88 -1.5 L 10.5 6.75 V 1.5" stroke="#92400E" strokeWidth={1.2} />
    </g>
  </svg>
);
export const BookIcon = forwardRef(icon);
