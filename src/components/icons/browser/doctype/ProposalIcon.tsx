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
      <path
        d="M 6.75 2.25 h 7.5 l 4.5 4.5 v 13.5 a 1.5 1.5 0 0 1 -1.5 1.5 H 6.75 a 1.5 1.5 0 0 1 -1.5 -1.5 V 3.75 a 1.5 1.5 0 0 1 1.5 -1.5 z"
        stroke="#D97706"
        strokeWidth={1.2}
      />
      <path d="M 14.25 2.25 v 4.5 h 4.5" stroke="#D97706" strokeWidth={1.2} />
      <circle cx="12" cy="13.5" r="4.12" stroke="#D97706" strokeWidth={1.2} />
      <path d="M 10.05 13.65 l 1.42 1.42 l 2.62 -3" stroke="#D97706" strokeWidth={1.2} />
    </g>
  </svg>
);
export const ProposalIcon = forwardRef(icon);
