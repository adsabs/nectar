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
      <path d="M 9.75 2.25 h 4.5" stroke="#0891B2" strokeWidth={1.2} />
      <path
        d="M 10.88 2.25 v 3.38 L 6.52 15 a 1.8 1.8 0 0 0 1.58 2.62 h 7.8 a 1.8 1.8 0 0 0 1.58 -2.62 L 13.12 5.62 V 2.25"
        stroke="#0891B2"
        strokeWidth={1.2}
      />
      <path d="M 8.48 12.38 h 7.05" stroke="#0891B2" strokeWidth={1.2} />
    </g>
  </svg>
);
export const InstrumentIcon = forwardRef(icon);
