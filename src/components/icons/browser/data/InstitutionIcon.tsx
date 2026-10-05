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
      <path d="M 2.62 7.5 L 12 2.62 L 21.38 7.5" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 6 9.38 v 6 M 12 9.38 v 6 M 18 9.38 v 6" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 4.12 18 h 15.75" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 3 20.62 h 18" stroke="#64748B" strokeWidth={1.2} />
    </g>
  </svg>
);
export const InstitutionIcon = forwardRef(icon);
