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
      <path d="M 3.38 9 a 4.5 4.5 0 0 0 4.12 4.12 z" stroke="#0E7490" strokeWidth={1.2} />
      <path d="M 5.44 11.06 l 1.69 -1.69" stroke="#0E7490" strokeWidth={1.2} />
      <circle cx="7.31" cy="9.19" r="0.56" fill="#0E7490" />
      <path d="M 10.5 9 a 4.5 4.5 0 0 0 4.12 4.12 z" stroke="#0E7490" strokeWidth={1.2} />
      <path d="M 12.56 11.06 l 1.69 -1.69" stroke="#0E7490" strokeWidth={1.2} />
      <circle cx="14.44" cy="9.19" r="0.56" fill="#0E7490" />
      <path d="M 17.62 9 a 4.5 4.5 0 0 0 4.12 4.12 z" stroke="#0E7490" strokeWidth={1.2} />
      <path d="M 19.69 11.06 l 1.69 -1.69" stroke="#0E7490" strokeWidth={1.2} />
      <circle cx="21.56" cy="9.19" r="0.56" fill="#0E7490" />
      <path d="M 5.62 12.75 v 6" stroke="#0E7490" strokeWidth={1.2} />
      <path d="M 12.75 12.75 v 6" stroke="#0E7490" strokeWidth={1.2} />
      <path d="M 19.88 12.75 v 6" stroke="#0E7490" strokeWidth={1.2} />
      <path d="M 2.25 18.75 h 19.5" stroke="#0E7490" strokeWidth={1.2} />
    </g>
  </svg>
);
export const DishArrayIcon = forwardRef(icon);
