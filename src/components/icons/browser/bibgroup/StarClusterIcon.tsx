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
      <circle cx="12" cy="5.25" r="1.2" fill="#A855F7" />
      <circle cx="7.88" cy="8.25" r="1.2" fill="#A855F7" />
      <circle cx="16.12" cy="8.25" r="1.2" fill="#A855F7" />
      <circle cx="9.75" cy="11.62" r="1.2" fill="#A855F7" />
      <circle cx="14.25" cy="11.62" r="1.2" fill="#A855F7" />
      <circle cx="8.25" cy="15.75" r="1.2" fill="#A855F7" />
      <circle cx="15.75" cy="15.75" r="1.2" fill="#A855F7" />
    </g>
  </svg>
);
export const StarClusterIcon = forwardRef(icon);
