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
      <rect x="4.5" y="4.5" width="6.75" height="6.75" rx="1.5" stroke="#2563EB" strokeWidth={1.2} />
      <rect x="12.75" y="4.5" width="6.75" height="6.75" rx="1.5" stroke="#2563EB" strokeWidth={1.2} />
      <rect x="4.5" y="12.75" width="6.75" height="6.75" rx="1.5" stroke="#2563EB" strokeWidth={1.2} />
      <rect x="12.75" y="12.75" width="6.75" height="6.75" rx="1.5" stroke="#2563EB" strokeWidth={1.2} />
    </g>
  </svg>
);
export const CatalogIcon = forwardRef(icon);
