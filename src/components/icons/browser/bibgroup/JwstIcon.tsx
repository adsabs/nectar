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
        d="M 15.45 12 L 13.73 14.98 L 10.27 14.98 L 8.55 12 L 10.27 9.02 L 13.73 9.02 z"
        stroke="#D97706"
        strokeWidth={1.2}
      />
      <path
        d="M 21.43 12 L 19.7 14.98 L 16.25 14.98 L 14.53 12 L 16.25 9.02 L 19.7 9.02 z"
        stroke="#D97706"
        strokeWidth={1.2}
      />
      <path
        d="M 18.43 17.17 L 16.71 20.16 L 13.26 20.16 L 11.54 17.17 L 13.26 14.19 L 16.71 14.19 z"
        stroke="#D97706"
        strokeWidth={1.2}
      />
      <path
        d="M 12.46 17.17 L 10.74 20.16 L 7.29 20.16 L 5.56 17.17 L 7.29 14.19 L 10.74 14.19 z"
        stroke="#D97706"
        strokeWidth={1.2}
      />
      <path
        d="M 9.47 12 L 7.75 14.98 L 4.3 14.98 L 2.57 12 L 4.3 9.02 L 7.75 9.02 z"
        stroke="#D97706"
        strokeWidth={1.2}
      />
      <path
        d="M 12.46 6.82 L 10.74 9.81 L 7.29 9.81 L 5.56 6.82 L 7.29 3.84 L 10.74 3.84 z"
        stroke="#D97706"
        strokeWidth={1.2}
      />
      <path
        d="M 18.43 6.82 L 16.71 9.81 L 13.26 9.81 L 11.54 6.82 L 13.26 3.84 L 16.71 3.84 z"
        stroke="#D97706"
        strokeWidth={1.2}
      />
    </g>
  </svg>
);
export const JwstIcon = forwardRef(icon);
