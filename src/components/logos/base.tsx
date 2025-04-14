import React from 'react';
import type { SVGProps } from 'react';
export const Base = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      aria-hidden="true"
      viewBox="0 0 111 111"
      {...props}
    >
      <path
        fill="#0A0B0D"
        d="M54.921 110.034c30.438 0 55.113-24.632 55.113-55.017S85.359 0 54.921 0C26.043 0 2.353 22.171 0 50.392h72.847v9.25H0c2.353 28.22 26.043 50.392 54.921 50.392"
      />
    </svg>
  );
};