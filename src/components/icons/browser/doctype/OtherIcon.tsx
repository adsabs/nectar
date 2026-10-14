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
      <rect
        x="5.25"
        y="5.25"
        width="13.5"
        height="13.5"
        rx="3.75"
        strokeDasharray="3 2.62"
        stroke="#9AA3B2"
        strokeWidth={1.2}
      />
      <circle cx="9" cy="12" r="1.12" fill="#9AA3B2" />
      <circle cx="12" cy="12" r="1.12" fill="#9AA3B2" />
      <circle cx="15" cy="12" r="1.12" fill="#9AA3B2" />
    </g>
  </svg>
);
export const OtherIcon = forwardRef(icon);
