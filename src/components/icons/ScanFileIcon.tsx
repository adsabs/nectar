import { forwardRef, Ref, SVGProps } from 'react';

const scanFileIcon = (props: SVGProps<SVGSVGElement>, ref: Ref<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 550.801 550.801" ref={ref} {...props}>
    <g fill="#007bff">
      <path
        d="M475.095,131.986c-0.032-2.525-0.844-5.015-2.568-6.992L366.324,3.684c-0.021-0.029-0.053-0.045-0.084-0.071
        c-0.633-0.712-1.36-1.289-2.141-1.803c-0.232-0.15-0.465-0.29-0.707-0.422c-0.686-0.372-1.393-0.669-2.131-0.891
        c-0.2-0.058-0.379-0.145-0.59-0.188C359.87,0.114,359.037,0,358.203,0H97.2C85.292,0,75.6,9.688,75.6,21.601v507.6
        c0,11.907,9.692,21.601,21.6,21.601H453.6c11.908,0,21.601-9.693,21.601-21.601V133.197
        C475.2,132.791,475.137,132.393,475.095,131.986z M97.2,21.601h250.203v110.51c0,5.962,4.831,10.8,10.8,10.8H453.6l0.011,223.837
        H97.2V21.601z"
      />

      <path d="M190,180 h170 v15 h-170 z M190,215 h170 v15 h-170 z M190,250 h120 v15 h-120 z" />
      <text
        x="50%"
        y="500"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="135"
        fontWeight="bold"
        fill="#fff"
      >
        SCAN
      </text>
    </g>
  </svg>
);

export const ScanFileIcon = forwardRef(scanFileIcon);
