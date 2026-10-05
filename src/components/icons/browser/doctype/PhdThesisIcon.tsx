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
      <path d="M 12 3.75 l 8.25 3.38 L 12 10.5 L 3.75 7.12 z" stroke="#8B5CF6" strokeWidth={1.2} />
      <path d="M 6.75 9.23 V 13.5 c 0 1.65 10.5 1.65 10.5 0 v -4.28" stroke="#8B5CF6" strokeWidth={1.2} />
      <path d="M 18.75 7.5 v 4.88" stroke="#8B5CF6" strokeWidth={1.2} />
      <circle cx="18.75" cy="13.65" r="1.12" fill="#8B5CF6" />
    </g>
  </svg>
);
export const PhdThesisIcon = forwardRef(icon);
