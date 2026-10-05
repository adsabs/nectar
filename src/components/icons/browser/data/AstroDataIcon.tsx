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
        d="M 9.75 3 c 0.52 3.38 1.88 4.72 5.25 5.25 c -3.38 0.52 -4.72 1.88 -5.25 5.25 c -0.52 -3.38 -1.88 -4.72 -5.25 -5.25 c 3.38 -0.52 4.72 -1.88 5.25 -5.25 z"
        stroke="#8B5CF6"
        strokeWidth={1.2}
      />
      <path
        d="M 17.62 13.12 c 0.3 1.8 0.98 2.47 2.78 2.78 c -1.8 0.3 -2.47 0.98 -2.78 2.78 c -0.3 -1.8 -0.98 -2.47 -2.78 -2.78 c 1.8 -0.3 2.47 -0.98 2.78 -2.78 z"
        stroke="#8B5CF6"
        strokeWidth={1.2}
      />
      <path
        d="M 4.5 16.5 c 0.22 1.2 0.68 1.65 1.88 1.88 c -1.2 0.22 -1.65 0.68 -1.88 1.88 c -0.22 -1.2 -0.68 -1.65 -1.88 -1.88 c 1.2 -0.22 1.65 -0.68 1.88 -1.88 z"
        stroke="#8B5CF6"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const AstroDataIcon = forwardRef(icon);
