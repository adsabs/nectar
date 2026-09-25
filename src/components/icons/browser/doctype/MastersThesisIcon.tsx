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
      <circle cx="7.5" cy="11.25" r="3" stroke="#6D28D9" strokeWidth={1.2} />
      <path d="M 6.45 11.25 a 1.05 1.05 0 1 0 2.1 0 a 1.05 1.05 0 1 0 -2.1 0" stroke="#6D28D9" strokeWidth={1.2} />
      <path d="M 7.5 8.25 h 10.88 a 3 3 0 0 1 0 6 H 7.5" stroke="#6D28D9" strokeWidth={1.2} />
      <circle cx="12.75" cy="11.25" r="1.35" stroke="#6D28D9" strokeWidth={1.2} />
      <path d="M 11.7 12.15 L 9.75 18.75 l 2.55 -1.5 l 2.55 1.5 l -1.8 -6.6" stroke="#6D28D9" strokeWidth={1.2} />
    </g>
  </svg>
);
export const MastersThesisIcon = forwardRef(icon);
