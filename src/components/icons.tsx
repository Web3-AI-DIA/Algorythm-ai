import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient
          id="blueToGreen"
          x1="60"
          y1="50"
          x2="40"
          y2="70"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#39FF14" />
        </linearGradient>
        <linearGradient
          id="blueToYellow"
          x1="60"
          y1="50"
          x2="80"
          y2="70"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00BFFF" />
          <stop offset="100%" stopColor="#FFFF00" />
        </linearGradient>
      </defs>

      <g strokeWidth="3" opacity="0.8">
        <line x1="60" y1="50" x2="60" y2="60" stroke="#00BFFF" />
        <line x1="40" y1="60" x2="60" y2="60" stroke="url(#blueToGreen)" />
        <line x1="60" y1="60" x2="80" y2="60" stroke="url(#blueToYellow)" />
        <line x1="40" y1="60" x2="40" y2="70" stroke="#39FF14" />
        <line x1="80" y1="60" x2="80" y2="70" stroke="#FFFF00" />
      </g>

      <rect
        x="50"
        y="30"
        width="20"
        height="20"
        rx="2"
        fill="#00BFFF"
        filter="url(#glow)"
      />
      <rect
        x="30"
        y="70"
        width="20"
        height="20"
        rx="2"
        fill="#39FF14"
        filter="url(#glow)"
      />
      <rect
        x="70"
        y="70"
        width="20"
        height="20"
        rx="2"
        fill="#FFFF00"
        filter="url(#glow)"
      />
    </svg>
  );
}
