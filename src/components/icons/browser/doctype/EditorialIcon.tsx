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
        d="M 12 2.25 c 2.85 2.85 4.5 5.85 4.5 9 l -4.5 4.5 l -4.5 -4.5 c 0 -3.15 1.65 -6.15 4.5 -9 z"
        stroke="#EC4899"
        strokeWidth={1.2}
      />
      <path d="M 12 9.38 V 13.5" stroke="#EC4899" strokeWidth={1.2} />
      <circle cx="12" cy="7.5" r="0.98" stroke="#EC4899" strokeWidth={1.2} />
    </g>
  </svg>
);
export const EditorialIcon = forwardRef(icon);
