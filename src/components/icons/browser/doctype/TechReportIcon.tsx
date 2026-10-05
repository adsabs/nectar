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
        d="M 6.75 2.25 h 7.5 l 4.5 4.5 v 13.5 a 1.5 1.5 0 0 1 -1.5 1.5 H 6.75 a 1.5 1.5 0 0 1 -1.5 -1.5 V 3.75 a 1.5 1.5 0 0 1 1.5 -1.5 z"
        stroke="#64748B"
        strokeWidth={1.2}
      />
      <path d="M 14.25 2.25 v 4.5 h 4.5" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 8.25 10.5 h 4.5" stroke="#64748B" strokeWidth={1.2} />
      <path d="M 8.25 13.5 h 4.5" stroke="#64748B" strokeWidth={1.2} />
      <circle cx="15.75" cy="17.25" r="3" stroke="#64748B" strokeWidth={1.2} />
      <path
        d="M 19.65 17.25 H 21 M 18.52 20.02 L 19.5 21 M 15.75 21.15 V 22.5 M 12.98 20.02 L 12 21 M 11.85 17.25 H 10.5 M 12.98 14.48 L 12 13.5 M 15.75 13.35 V 12 M 18.52 14.48 L 19.5 13.5"
        stroke="#64748B"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const TechReportIcon = forwardRef(icon);
