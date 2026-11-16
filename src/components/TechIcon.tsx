import type { ReactNode } from "react";

type TechIconProps = {
  slug: string;
  className?: string;
};

const iconMap: Record<string, ReactNode> = {
  react: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="6" fill="#61DAFB" />
      <g stroke="#61DAFB" strokeWidth="4" strokeLinecap="round">
        <ellipse cx="32" cy="32" rx="18" ry="8" transform="rotate(60 32 32)" />
        <ellipse cx="32" cy="32" rx="18" ry="8" transform="rotate(120 32 32)" />
        <ellipse cx="32" cy="32" rx="18" ry="8" />
      </g>
    </svg>
  ),
  nextjs: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#111" />
      <path
        d="M20 44V20h10l8 24 8-24h10"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  typescript: (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#3178C6" />
      <path d="M22 24h20v20H22z" fill="#fff" />
      <path
        d="M38 34.5c0 5.8-5.4 7.8-9.7 7.8-2.9 0-5.3-1-6.8-2.8l4.5-4.2c.9 1.2 2 1.8 3.6 1.8 1.7 0 3-.8 3-2.2 0-1-.7-1.7-3.8-2.7-3.6-1.1-5-2.5-5-4.8 0-2.7 2.3-4.7 6.7-4.7 2.9 0 5.1.9 6.5 2.4l-4.5 4.5c-.5-.5-1.2-.8-2-.8-1.4 0-2.4.7-2.4 1.8 0 1.1.9 1.7 3.4 2.4 3.5 1 5 2.3 5 4.9z"
        fill="#3178C6"
        opacity="0.95"
      />
    </svg>
  ),
  "tailwind-css": (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="14" fill="#38B2AC" />
      <path
        d="M18 32c9.4-2.8 15.7 1.9 23.5 5.6 1.8.9 3.8-1.1 2.7-2.8-5.5-7.5-12.1-11-22.1-7.6-1.5.5-2.5 2.1-1.5 3.6 1 1.6 2.6.6 4.3.1z"
        fill="#fff"
      />
      <path
        d="M31 40c9.4-2.8 15.7 1.9 23.5 5.6 1.8.9 3.8-1.1 2.7-2.8-5.5-7.5-12.1-11-22.1-7.6-1.5.5-2.5 2.1-1.5 3.6 1 1.6 2.6.6 4.3.1z"
        fill="#fff"
        opacity="0.85"
      />
    </svg>
  ),
  nodejs: (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <polygon points="32 6 56 18 56 46 32 58 8 46 8 18" fill="#3C873A" />
      <path d="M32 18l14 8v16l-14 8-14-8V26l14-8z" fill="#fff" opacity="0.9" />
      <path
        d="M32 22v20"
        stroke="#3C873A"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  ),
  postgresql: (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="#336791" />
      <path
        d="M22 25c2-6 10-8 14-8s12 2 12 8c0 6-4 10-7 12-6 3-11 3-17 1-3-1-5-4-5-8 0-4 2-7 3-7z"
        fill="#fff"
      />
      <path
        d="M32 14c3 4 4 9 4 14"
        stroke="#336791"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  docker: (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="24" width="52" height="30" rx="6" fill="#2496ED" />
      <rect x="18" y="12" width="8" height="12" rx="2" fill="#2496ED" />
      <rect x="28" y="12" width="8" height="12" rx="2" fill="#2496ED" />
      <rect x="38" y="12" width="8" height="12" rx="2" fill="#2496ED" />
      <rect x="18" y="18" width="6" height="6" fill="#fff" />
      <rect x="28" y="18" width="6" height="6" fill="#fff" />
      <rect x="38" y="18" width="6" height="6" fill="#fff" />
      <path d="M16 32h32v8H16z" fill="#1C6FB3" />
      <path d="M32 38h20v10H32z" fill="#1C6FB3" />
    </svg>
  ),
  aws: (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 34c3-10 12-14 21-14 9 0 18 4 21 14 0 0 3 8-3 12H15c-6-4-3-12-3-12z"
        fill="#FF9900"
      />
      <path d="M16 42h32v8H16z" fill="#803300" />
      <path d="M24 22l5 10 5-10" fill="#fff" opacity="0.8" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#999" />
      <path d="M24 24h16v16H24z" fill="#fff" />
    </svg>
  ),
};

export function TechIcon({ slug, className }: TechIconProps) {
  return (
    <span className={className} aria-hidden="true">
      {iconMap[slug] ?? iconMap.default}
    </span>
  );
}
