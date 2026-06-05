import { forwardRef, Ref, SVGProps } from 'react';
const icon = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg
    id="Icons"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 32 32"
    xmlSpace="preserve"
    width="64px"
    height="64px"
    fill="#EC4899"
    stroke="#EC4899"
    role="img"
    ref={ref}
    {...props}
  >
    \
    <g id="SVGRepo_iconCarrier">
      <style type="text/css">
        {
          ' .st0{fill:none;stroke:#EC4899;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;} '
        }
      </style>
      <polyline className="st0" points="24,29 29,29 29,20 24,17 " />
      <polyline className="st0" points="8,24 3,24 3,29 8,29 8,24 " />
      <path className="st0" d="M19,29h-6v-5c0-1.7,1.3-3,3-3h0c1.7,0,3,1.3,3,3V29z" />
      <line className="st0" x1={24} y1={29} x2={13} y2={29} />
      <polyline className="st0" points="13,29 8,29 8,17 24,17 24,29 " />
      <path className="st0" d="M16,5C9.4,5,4,10.4,4,17h4c0-4.4,3.6-8,8-8s8,3.6,8,8" />
      <polyline className="st0" points="23,13 28,8 25,5 20,10 " />
    </g>
  </svg>
);
export const HEASARCIcon = forwardRef(icon);
