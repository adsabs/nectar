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
      <rect x="3" y="5.25" width="3.75" height="3.75" rx="0.75" stroke="#0EA5E9" strokeWidth={1.2} />
      <path d="M 1.12 7.12 h 1.88 M 6.75 7.12 h 1.88" stroke="#0EA5E9" strokeWidth={1.2} />
      <rect x="17.25" y="15" width="3.75" height="3.75" rx="0.75" stroke="#0EA5E9" strokeWidth={1.2} />
      <path d="M 15.38 16.88 H 17.25 M 21 16.88 h 1.88" stroke="#0EA5E9" strokeWidth={1.2} />
      <circle cx="12" cy="12" r="1.88" stroke="#0EA5E9" strokeWidth={1.2} />
    </g>
  </svg>
);
export const StereoIcon = forwardRef(icon);
