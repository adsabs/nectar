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
        d="M 12 6.38 C 10.12 5.03 7.5 4.72 5.25 5.25 v 12 c 2.25 -0.52 4.88 -0.22 6.75 1.12 c 1.88 -1.35 4.5 -1.65 6.75 -1.12 V 5.25 c -2.25 -0.52 -4.88 -0.22 -6.75 1.12 z"
        stroke="#B45309"
        strokeWidth={1.2}
      />
      <path d="M 12 6.38 V 17.25" stroke="#B45309" strokeWidth={1.2} />
      <path d="M 16.12 5.1 v 4.65 l -1.5 -1.12 l -1.5 1.12 V 5.1" stroke="#B45309" strokeWidth={1.2} />
    </g>
  </svg>
);
export const BookChapterIcon = forwardRef(icon);
