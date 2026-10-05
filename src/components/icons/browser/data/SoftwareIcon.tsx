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
        d="M 17.09 10.73 L 19.45 11.08 L 19.45 12.91 L 17.09 13.27 L 16.5 14.71 L 17.91 16.62 L 16.62 17.91 L 14.71 16.5 L 13.27 17.09 L 12.91 19.45 L 11.08 19.45 L 10.73 17.09 L 9.29 16.5 L 7.38 17.91 L 6.09 16.62 L 7.5 14.71 L 6.91 13.27 L 4.55 12.91 L 4.55 11.08 L 6.91 10.73 L 7.5 9.29 L 6.09 7.38 L 7.38 6.09 L 9.29 7.5 L 10.73 6.91 L 11.08 4.55 L 12.91 4.55 L 13.27 6.91 L 14.71 7.5 L 16.62 6.09 L 17.91 7.38 L 16.5 9.29 z"
        stroke="#6B7280"
        strokeWidth={1.2}
      />
      <circle cx="12" cy="12" r="2.4" stroke="#6B7280" strokeWidth={1.2} />
    </g>
  </svg>
);
export const SoftwareIcon = forwardRef(icon);
