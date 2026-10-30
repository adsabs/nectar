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
      <path d="M 3.15 10.2 a 5.4 5.4 0 0 0 4.95 4.95 z" stroke="#65A30D" strokeWidth={1.2} />
      <path d="M 5.62 12.67 l 2.03 -2.03" stroke="#65A30D" strokeWidth={1.2} />
      <circle cx="7.88" cy="10.43" r="0.68" fill="#65A30D" />
      <path d="M 5.62 14.62 V 19.5" stroke="#65A30D" strokeWidth={1.2} />
      <path d="M 5.62 18 l -2.62 3" stroke="#65A30D" strokeWidth={1.2} />
      <path d="M 5.62 18 l 2.62 3" stroke="#65A30D" strokeWidth={1.2} />
      <path d="M 13.12 9.38 a 6.75 6.75 0 0 1 4.88 4.88" stroke="#65A30D" strokeWidth={1.2} />
      <path d="M 15.75 6.38 a 10.5 10.5 0 0 1 7.5 7.5" stroke="#65A30D" strokeWidth={1.2} />
    </g>
  </svg>
);
export const SetiIcon = forwardRef(icon);
