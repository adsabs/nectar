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
      <path d="M 4.5 7.5 l 12.75 6.75" stroke="#A16207" strokeWidth={1.2} />
      <path d="M 6.38 10.88 L 19.12 17.62" stroke="#A16207" strokeWidth={1.2} />
      <path d="M 17.25 14.25 l 1.88 3.38" stroke="#A16207" strokeWidth={1.2} />
      <path d="M 4.5 7.5 l -1.5 -1.12" stroke="#A16207" strokeWidth={1.2} />
      <path d="M 11.62 12.6 v 2.78" stroke="#A16207" strokeWidth={1.2} />
      <path d="M 11.62 15.38 L 7.5 21" stroke="#A16207" strokeWidth={1.2} />
      <path d="M 11.62 15.38 L 15.75 21" stroke="#A16207" strokeWidth={1.2} />
      <path d="M 11.62 15.38 V 21" stroke="#A16207" strokeWidth={1.2} />
    </g>
  </svg>
);
export const VintageScopeIcon = forwardRef(icon);
