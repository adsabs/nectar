import { forwardRef, Ref, SVGProps } from 'react';
const icon = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg
    width="64px"
    height="64px"
    viewBox="-2.4 -2.4 28.80 28.80"
    id="Layer_1"
    data-name="Layer 1"
    xmlns="http://www.w3.org/2000/svg"
    fill="#000000"
    role="img"
    ref={ref}
    {...props}
  >
    <g id="SVGRepo_iconCarrier">
      <defs>
        <style>{'.cls-1{fill:none;stroke:#6366F1;stroke-miterlimit:10;stroke-width:1.5;}'}</style>
      </defs>
      <circle className="cls-1" cx={20.59} cy={3.41} r={1.91} />
      <line className="cls-1" x1={20.27} y1={5.29} x2={17.69} y2={11.01} />
      <line className="cls-1" x1={18.71} y1={3.73} x2={12.99} y2={6.31} />
      <polyline className="cls-1" points="15.82 18.96 15.82 22.5 1.5 22.5 1.5 19.64 6.38 14.76" />
      <path
        className="cls-1"
        d="M15.57,3h1.35a0,0,0,0,1,0,0v18.9a0,0,0,0,1,0,0H15.57a9.45,9.45,0,0,1-9.45-9.45v0A9.45,9.45,0,0,1,15.57,3Z"
        transform="translate(-5.45 11.8) rotate(-45)"
      />
    </g>
  </svg>
);
export const MASTIcon = forwardRef(icon);
