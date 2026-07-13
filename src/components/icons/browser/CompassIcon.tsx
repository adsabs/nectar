import { forwardRef, Ref, SVGProps } from 'react';
const icon = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={64}
    height={64}
    fill="none"
    stroke="#000"
    strokeWidth={0}
    viewBox="0 0 24 24"
    ref={ref}
    role="img"
    {...props}
  >
    <g fill="#049dd9" stroke="none">
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path
        fillRule="evenodd"
        d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm5.189 7.076a1 1 0 0 0-1.265-1.265l-6.36 2.12a1 1 0 0 0-.633.633l-2.12 6.36a1 1 0 0 0 1.265 1.265l6.36-2.12a1 1 0 0 0 .633-.633l2.12-6.36Z"
        clipRule="evenodd"
      />
    </g>
  </svg>
);
export const CompassIcon = forwardRef(icon);
