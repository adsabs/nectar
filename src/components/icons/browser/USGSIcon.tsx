import { forwardRef, Ref, SVGProps } from 'react';
const icon = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg
    fill="#0F2C70"
    width="64px"
    height="64px"
    viewBox="-2.4 -2.4 28.80 28.80"
    role="img"
    ref={ref}
    {...props}
    stroke="#0F2C70"
  >
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <title>Roots Bedrock icon</title>
      <path d="M.4 0L0 .4v5.2l.343.343 11.314-1.886L12 4.4V8l11.52-1.92.48-.48V.4l-.4-.4zm.08 9.92L0 10.4v3.2l.343.343L12 12V8zM12 12v4l11.52-1.92.48-.48v-3.2l-.343-.343zM.48 17.92L0 18.4v5.2l.4.4h23.2l.4-.4v-5.2l-.343-.343-11.314 1.886L12 19.6V16L.48 17.92z"></path>
    </g>
  </svg>
);
export const USGSIcon = forwardRef(icon);
