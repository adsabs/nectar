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
      <path d="M 8.25 7.88 L 4.12 12 l 4.12 4.12" stroke="#7C5CFC" strokeWidth={1.2} />
      <path d="M 15.75 7.88 l 4.12 4.12 l -4.12 4.12" stroke="#7C5CFC" strokeWidth={1.2} />
      <path d="M 13.5 4.88 l -3 14.25" stroke="#7C5CFC" strokeWidth={1.2} />
    </g>
  </svg>
);
export const SoftwareIcon = forwardRef(icon);
