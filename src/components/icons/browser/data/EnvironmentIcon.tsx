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
        d="M 4.5 19.5 C 4.5 11.25 11.25 4.5 19.5 4.5 c 0 8.25 -6.75 15 -15 15 z"
        stroke="#22A06B"
        strokeWidth={1.2}
      />
      <path d="M 6.38 17.62 C 9.75 14.25 13.12 10.88 16.5 7.5" stroke="#22A06B" strokeWidth={1.2} />
    </g>
  </svg>
);
export const EnvironmentIcon = forwardRef(icon);
