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
      <path d="M 23 4 v 6 h -6" stroke="#0D9488" strokeWidth={1.2} />
      <path d="M 20.49 15 A 9 9 0 1 1 18.37 5.64 L 23 10" stroke="#0D9488" strokeWidth={1.2} />
    </g>
  </svg>
);
export const CircularIcon = forwardRef(icon);
