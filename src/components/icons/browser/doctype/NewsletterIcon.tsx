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
      <rect x="3" y="6.75" width="18" height="11.25" rx="1.88" stroke="#E11D48" strokeWidth={1.2} />
      <path d="M 3.6 8.1 L 12 13.65 l 8.4 -5.55" stroke="#E11D48" strokeWidth={1.2} />
    </g>
  </svg>
);
export const NewsletterIcon = forwardRef(icon);
