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
        stroke="#2E7CD6"
        strokeWidth={1.2}
      />
      <path d="M 14.25 2.25 v 4.5 h 4.5" stroke="#2E7CD6" strokeWidth={1.2} />
      <path d="M 8.25 10.88 h 7.5" stroke="#2E7CD6" strokeWidth={1.2} />
      <path d="M 8.25 13.88 h 7.5" stroke="#2E7CD6" strokeWidth={1.2} />
      <path d="M 8.25 16.88 h 4.5" stroke="#2E7CD6" strokeWidth={1.2} />
    </g>
  </svg>
);
export const JournalArticleIcon = forwardRef(icon);
