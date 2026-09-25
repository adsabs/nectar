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
      <rect x="4.5" y="5.25" width="15" height="13.5" rx="1.5" stroke="#0D9488" strokeWidth={1.2} />
      <path d="M 4.5 9.38 h 15" stroke="#0D9488" strokeWidth={1.2} />
      <path d="M 7.5 12.38 h 5.25" stroke="#0D9488" strokeWidth={1.2} />
      <path d="M 7.5 15.38 h 8.25" stroke="#0D9488" strokeWidth={1.2} />
    </g>
  </svg>
);
export const CatalogIcon = forwardRef(icon);
