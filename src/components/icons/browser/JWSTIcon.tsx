import { forwardRef, Ref, SVGProps } from 'react';
const icon = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg
    fill="#000000"
    width="64px"
    height="64px"
    viewBox="0 0 24 24"
    id="satellite-3"
    data-name="Flat Line"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    ref={ref}
    {...props}
  >
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <path
        id="secondary"
        d="M8.24,7.76h8a3,3,0,0,1,3,3v0a3,3,0,0,1-3,3h-8a1,1,0,0,1-1-1v-4a1,1,0,0,1,1-1Z"
        fill="#2ca9bc"
        fill-width="1.2"
        transform="translate(-3.73 12.51) rotate(-45)"
      ></path>
      <path
        id="primary"
        d="M3.29,4.71,4.71,3.29a1,1,0,0,1,1.41,0l2.29,2.3L5.59,8.41,3.29,6.12A1,1,0,0,1,3.29,4.71ZM7,7,9.71,9.71m9.58,11,1.42-1.42a1,1,0,0,0,0-1.41l-2.3-2.29-2.82,2.82,2.29,2.3A1,1,0,0,0,19.29,20.71ZM17,17l-2.71-2.71m-5.45.87L6,18M13.24,6.51,7.59,12.17a1,1,0,0,0,0,1.42l2.82,2.82a1,1,0,0,0,1.42,0l5.66-5.65a3,3,0,0,0,0-4.25h0A3,3,0,0,0,13.24,6.51Z"
        fill="none"
        stroke="#000000"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.2"
      ></path>
      <line
        id="primary-upstroke"
        x1="5.95"
        y1="18"
        x2="6.05"
        y2="18"
        fill="none"
        stroke="#000000"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.2"
      ></line>
    </g>
  </svg>
);
export const JWSTIcon = forwardRef(icon);
