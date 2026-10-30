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
      <path d="M 2.25 15.75 a 5.25 5.25 0 0 1 10.5 0" stroke="#475569" strokeWidth={1.2} />
      <path d="M 11.25 15.75 a 5.25 5.25 0 0 1 10.5 0" stroke="#475569" strokeWidth={1.2} />
      <path d="M 1.5 15.75 h 21" stroke="#475569" strokeWidth={1.2} />
      <path d="M 7.5 10.88 V 15.75" stroke="#475569" strokeWidth={1.2} />
      <path d="M 16.5 10.88 V 15.75" stroke="#475569" strokeWidth={1.2} />
    </g>
  </svg>
);
export const TwinDomeIcon = forwardRef(icon);
