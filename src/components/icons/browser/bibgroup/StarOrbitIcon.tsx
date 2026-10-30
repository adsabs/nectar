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
        d="M 9.75 4.5 c 0.38 2.25 1.27 3.15 3.53 3.53 c -2.25 0.38 -3.15 1.27 -3.53 3.53 c -0.38 -2.25 -1.27 -3.15 -3.53 -3.53 c 2.25 -0.38 3.15 -1.27 3.53 -3.53 z"
        stroke="#DB2777"
        strokeWidth={1.2}
      />
      <path
        d="M 19.75 9.93 L 19.82 10.46 L 19.63 11.06 L 19.23 11.71 L 18.6 12.4 L 17.77 13.1 L 16.76 13.78 L 15.62 14.44 L 14.36 15.04 L 13.03 15.57 L 11.66 16.01 L 10.31 16.37 L 9.02 16.61 L 7.8 16.73 L 6.72 16.73 L 5.8 16.61 L 5.06 16.37 L 4.54 16.02 L 4.25 15.57 L 4.19 15.04 L 4.37 14.44 L 4.77 13.79 L 5.4 13.1 L 6.23 12.4 L 7.24 11.72 L 8.38 11.06 L 9.64 10.46 L 10.97 9.93 L 12.34 9.49 L 13.69 9.13 L 14.98 8.89 L 16.2 8.77 L 17.28 8.77 L 18.2 8.89 L 18.94 9.13 L 19.46 9.48 L 19.75 9.93"
        stroke="#DB2777"
        strokeWidth={1.2}
      />
      <circle cx="18.2" cy="8.89" r="1.12" fill="#DB2777" />
    </g>
  </svg>
);
export const StarOrbitIcon = forwardRef(icon);
