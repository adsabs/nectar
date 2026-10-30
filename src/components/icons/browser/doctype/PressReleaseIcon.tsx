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
      <path d="M 3.75 9.38 v 5.25 H 7.12 L 15 18.75 V 5.25 L 7.12 9.38 z" stroke="#F59E0B" strokeWidth={1.2} />
      <path d="M 17.25 7.88 a 4.88 4.88 0 0 1 0 8.25" stroke="#F59E0B" strokeWidth={1.2} />
      <path d="M 6.38 14.62 L 5.62 18.75" stroke="#F59E0B" strokeWidth={1.2} />
    </g>
  </svg>
);
export const PressReleaseIcon = forwardRef(icon);
