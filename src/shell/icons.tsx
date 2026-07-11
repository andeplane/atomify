/**
 * Inline SVG icons, lifted from the design file so the shell renders
 * pixel-identical glyphs without an icon-font dependency.
 */

import type { ReactElement, ReactNode } from "react";

interface IconProps {
  size?: number;
}

const stroke = (
  size: number,
  path: ReactNode,
  strokeWidth = 1.8,
): ReactElement => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {path}
  </svg>
);

export const AtomLogo = ({ size = 28 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="2" fill="var(--accent)" />
    <ellipse
      cx="12"
      cy="12"
      rx="10"
      ry="4.4"
      stroke="var(--accent)"
      strokeWidth="1.5"
      opacity="0.9"
      transform="rotate(60 12 12)"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="10"
      ry="4.4"
      stroke="var(--accent)"
      strokeWidth="1.5"
      opacity="0.55"
      transform="rotate(-60 12 12)"
    />
  </svg>
);

export const HomeIcon = ({ size = 17 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>,
  );

export const GridIcon = ({ size = 17 }: IconProps) =>
  stroke(
    size,
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>,
  );

export const PlusIcon = ({ size = 15 }: IconProps) =>
  stroke(size, <path d="M12 5v14M5 12h14" />, 2);

export const PlayIcon = ({ size = 13 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.87l12-7.5a1 1 0 0 0 0-1.74l-12-7.5A1 1 0 0 0 7 4.5Z" />
  </svg>
);

export const StopIcon = ({ size = 11 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <rect x="5" y="5" width="14" height="14" rx="2.5" />
  </svg>
);

export const MoonIcon = ({ size = 15 }: IconProps) =>
  stroke(size, <path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z" />);

export const SunIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>,
  );

export const SlidersIcon = ({ size = 16 }: IconProps) =>
  stroke(
    size,
    <path d="M21 4H14M10 4H3M21 12H12M8 12H3M21 20H16M12 20H3M14 2v4M8 10v4M16 18v4" />,
    1.7,
  );

export const FileIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </>,
  );

export const NewFileIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6M9 15h6" />
    </>,
  );

export const ClockIcon = ({ size = 13 }: IconProps) =>
  stroke(
    size,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
    2,
  );

export const FolderIcon = ({ size = 15 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    opacity="0.9"
    aria-hidden
  >
    <path d="M4 4h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
  </svg>
);

export const FolderOutlineIcon = ({ size = 13 }: IconProps) =>
  stroke(
    size,
    <path d="M4 4h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />,
  );

export const ScriptIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="m8 9-3 3 3 3" />
      <path d="m16 9 3 3-3 3" />
      <path d="m13 6-2 12" />
    </>,
  );

export const ChartIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" />
    </>,
  );

export const SearchIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>,
    1.9,
  );

export const UploadIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5-5 5 5" />
      <path d="M12 5v14" />
    </>,
    1.9,
  );

export const DownloadIcon = ({ size = 14 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>,
  );

export const EditIcon = ({ size = 14 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>,
  );

export const TargetIcon = ({ size = 14 }: IconProps) =>
  stroke(
    size,
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </>,
  );

export const CheckIcon = ({ size = 14, strokeWidth = 2.6 }: IconProps & { strokeWidth?: number }) =>
  stroke(size, <path d="M20 6 9 17l-5-5" />, strokeWidth);

export const XIcon = ({ size = 18 }: IconProps) =>
  stroke(size, <path d="M18 6 6 18M6 6l12 12" />, 2);

export const MinusCircleIcon = ({ size = 14 }: IconProps) =>
  stroke(
    size,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>,
    2.2,
  );

export const ChevronDownIcon = ({ size = 14 }: IconProps) =>
  stroke(size, <path d="m6 9 6 6 6-6" />, 2.2);

export const ChevronRightIcon = ({ size = 16 }: IconProps) =>
  stroke(size, <path d="m9 18 6-6-6-6" />, 2);

export const BackIcon = ({ size = 14 }: IconProps) =>
  stroke(size, <path d="m15 18-6-6 6-6" />, 2);

export const DotsIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);

export const ShareIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4" />
      <path d="m15.4 6.5-6.8 4" />
    </>,
  );

export const InfoIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </>,
    2,
  );

export const WarningIcon = ({ size = 15 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </>,
    2,
  );

export const TrashIcon = ({ size = 13 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>,
    1.9,
  );

export const ExternalIcon = ({ size = 13 }: IconProps) =>
  stroke(
    size,
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>,
  );
