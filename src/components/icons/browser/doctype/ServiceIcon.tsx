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
      <circle cx="12" cy="12" r="3.75" stroke="#6B7280" strokeWidth={1.2} />
      <path
        d="M 12 6.38 V 3.75 M 12 20.25 v -2.62 M 6.38 12 H 3.75 M 20.25 12 h -2.62 M 8.02 8.02 l -1.88 -1.88 M 17.85 17.85 l -1.88 -1.88 M 15.98 8.02 l 1.88 -1.88 M 6.15 17.85 l 1.88 -1.88"
        stroke="#6B7280"
        strokeWidth={1.2}
      />
      <circle cx="12" cy="12" r="1.2" stroke="#6B7280" strokeWidth={1.2} />
    </g>
  </svg>
);
export const ServiceIcon = forwardRef(icon);
