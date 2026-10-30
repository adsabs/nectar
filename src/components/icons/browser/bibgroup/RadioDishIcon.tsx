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
      <path d="M 5.25 4.5 a 9 9 0 0 0 8.25 8.25 z" stroke="#0891B2" strokeWidth={1.2} />
      <path d="M 9.38 8.62 L 12.75 5.25" stroke="#0891B2" strokeWidth={1.2} />
      <circle cx="13.12" cy="4.88" r="1.12" fill="#0891B2" />
      <path d="M 8.25 11.25 v 6" stroke="#0891B2" strokeWidth={1.2} />
      <path d="M 8.25 15.75 l -3.75 4.5" stroke="#0891B2" strokeWidth={1.2} />
      <path d="M 8.25 15.75 l 3.75 4.5" stroke="#0891B2" strokeWidth={1.2} />
    </g>
  </svg>
);
export const RadioDishIcon = forwardRef(icon);
