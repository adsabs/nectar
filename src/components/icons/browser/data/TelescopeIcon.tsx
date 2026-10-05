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
      <path d="M 6 15 L 14.25 6.75" stroke="#e54680" strokeWidth={1.2} />
      <path d="M 7.88 16.88 L 16.12 8.62" stroke="#e54680" strokeWidth={1.2} />
      <path d="M 6 15 l 1.88 1.88" stroke="#e54680" strokeWidth={1.2} />
      <path d="M 14.25 6.75 l 1.88 1.88" stroke="#e54680" strokeWidth={1.2} />
      <path d="M 4.88 16.12 l -1.5 1.5" stroke="#e54680" strokeWidth={1.2} />
      <path d="M 11.25 12.75 v 2.25" stroke="#e54680" strokeWidth={1.2} />
      <path d="M 11.25 15 l -3.75 6.75" stroke="#e54680" strokeWidth={1.2} />
      <path d="M 11.25 15 l 3.75 6.75" stroke="#e54680" strokeWidth={1.2} />
      <path d="M 11.25 15 v 6.75" stroke="#e54680" strokeWidth={1.2} />
    </g>
  </svg>
);
export const TelescopeIcon = forwardRef(icon);
