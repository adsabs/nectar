import * as React from 'react';

function SvgOrcidInactive(props: React.SVGProps<SVGSVGElement>, svgRef?: React.Ref<SVGSVGElement>) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 69 69" xmlns="http://www.w3.org/2000/svg" ref={svgRef} {...props}>
      <g fill="none" fillRule="evenodd">
        <path
          d="M34.5 69C53.554 69 69 53.554 69 34.5 69 15.446 53.554 0 34.5 0 15.446 0 0 15.446 0 34.5 0 53.554 15.446 69 34.5 69z"
          fill="#C4C4C4"
        />
        <g fill="#FFF">
          <path d="M20 13h6v5h-6zM20 23.1h6v28.947h-6zM56.54 43.38c-.707 1.773-1.7 3.3-2.98 4.58-1.28 1.28-2.82 2.273-4.62 2.98-1.8.707-3.793 1.06-5.98 1.06H31.92V23.08h11.04c2.187 0 4.18.357 5.98 1.07 1.8.713 3.34 1.707 4.62 2.98 1.28 1.273 2.273 2.797 2.98 4.57.707 1.773 1.06 3.72 1.06 5.84 0 2.12-.353 4.067-1.06 5.84zm-4.44-5.84c0-1.587-.213-3.01-.64-4.27-.427-1.26-1.033-2.327-1.82-3.2a7.847 7.847 0 00-2.87-2.01c-1.127-.467-2.397-.7-3.81-.7h-5.62v20.36h5.62c1.413 0 2.683-.233 3.81-.7a7.847 7.847 0 002.87-2.01c.787-.873 1.393-1.94 1.82-3.2.427-1.26.64-2.683.64-4.27z" />
        </g>
      </g>
    </svg>
  );
}

export const OrcidInactiveLogo = React.forwardRef(SvgOrcidInactive);
