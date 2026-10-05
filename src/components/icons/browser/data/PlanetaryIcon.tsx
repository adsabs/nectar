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
        d="M 4.16 14.55 L 4.1 13.99 L 4.3 13.37 L 4.72 12.71 L 5.36 12.03 L 6.21 11.35 L 7.24 10.68 L 8.4 10.06 L 9.68 9.5 L 11.02 9.01 L 12.4 8.61 L 13.77 8.31 L 15.08 8.13 L 16.3 8.07 L 17.38 8.12 L 18.31 8.29 L 19.04 8.58 L 19.56 8.97 L 19.84 9.45"
        stroke="#F97316"
        strokeWidth={1.2}
      />
      <circle cx="12" cy="12" r="4.88" fill="#ffffff" stroke="#F97316" strokeWidth={1.2} />
      <path
        d="M 19.84 9.45 L 19.9 10.01 L 19.7 10.63 L 19.28 11.29 L 18.64 11.97 L 17.79 12.65 L 16.76 13.32 L 15.6 13.94 L 14.32 14.5 L 12.98 14.99 L 11.6 15.39 L 10.23 15.69 L 8.92 15.87 L 7.7 15.93 L 6.62 15.88 L 5.69 15.71 L 4.96 15.42 L 4.44 15.03 L 4.16 14.55"
        stroke="#F97316"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const PlanetaryIcon = forwardRef(icon);
