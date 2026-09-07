// Zero-Dependency Pure React 19 Native SVG Icons
import React from 'react';
import { IconBase } from './IconBase';
import type { IconProps } from './types';

export * from './types';
export * from './IconBase';

export const Activity: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
  </IconBase>
);

export const AlertCircle: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </IconBase>
);

export const AlertOctagon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 16h.01" />
    <path d="M12 8v4" />
    <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" />
  </IconBase>
);

export const AlertTriangle: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </IconBase>
);

export const ArrowLeft: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </IconBase>
);

export const ArrowRight: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </IconBase>
);

export const Baby: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
    <path d="M15 12h.01" />
    <path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
    <path d="M9 12h.01" />
  </IconBase>
);

export const Bed: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M2 4v16" />
    <path d="M2 8h18a2 2 0 0 1 2 2v10" />
    <path d="M2 17h20" />
    <path d="M6 8v9" />
  </IconBase>
);

export const Brain: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 18V5" />
    <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
    <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
    <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
    <path d="M18 18a4 4 0 0 0 2-7.464" />
    <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
    <path d="M6 18a4 4 0 0 1-2-7.464" />
    <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
  </IconBase>
);

export const Building: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M12 6h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M16 6h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
    <path d="M8 6h.01" />
    <path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    <rect x="4" y="2" width="16" height="20" rx="2" />
  </IconBase>
);

export const Building2: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M10 12h4" />
    <path d="M10 8h4" />
    <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
    <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
    <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
  </IconBase>
);

export const Calendar: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M8 2v3" />
    <path d="M16 2v3" />
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
  </IconBase>
);

export const Car: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </IconBase>
);

export const Check: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M20 6 9 17l-5-5" />
  </IconBase>
);

export const CheckCircle: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M21.801 10A10 10 0 1 1 17 3.335" />
    <path d="m9 11 3 3L22 4" />
  </IconBase>
);

export const CheckCircle2: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m16 9-5.5 5.5L8 12" />
  </IconBase>
);

export const ChevronDown: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m6 9 6 6 6-6" />
  </IconBase>
);

export const ChevronLeft: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m15 18-6-6 6-6" />
  </IconBase>
);

export const ChevronRight: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m9 18 6-6-6-6" />
  </IconBase>
);

export const ChevronUp: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m18 15-6-6-6 6" />
  </IconBase>
);

export const Clock: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </IconBase>
);

export const Compass: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
  </IconBase>
);

export const Disc: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="2" />
  </IconBase>
);

export const Download: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 15V3" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
  </IconBase>
);

export const Droplet: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
  </IconBase>
);

export const Droplets: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
    <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
  </IconBase>
);

export const ExternalLink: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </IconBase>
);

export const Eye: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
    <circle cx="12" cy="12" r="3" />
  </IconBase>
);

export const FileText: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
    <path d="M14 2v5a1 1 0 0 0 1 1h5" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </IconBase>
);

export const Flame: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
  </IconBase>
);

export const Heart: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
  </IconBase>
);

export const HeartPulse: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
    <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
  </IconBase>
);

export const Info: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </IconBase>
);

export const KeyRound: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
    <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
  </IconBase>
);

export const Languages: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m5 8 6 6" />
    <path d="m4 14 6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="m22 22-5-10-5 10" />
    <path d="M14 18h6" />
  </IconBase>
);

export const Locate: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="2" x2="5" y1="12" y2="12" />
    <line x1="19" x2="22" y1="12" y2="12" />
    <line x1="12" x2="12" y1="2" y2="5" />
    <line x1="12" x2="12" y1="19" y2="22" />
    <circle cx="12" cy="12" r="7" />
  </IconBase>
);

export const Lock: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </IconBase>
);

export const LogOut: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </IconBase>
);

export const MapPin: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <circle cx="12" cy="10" r="3" />
  </IconBase>
);

export const MessageSquare: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
  </IconBase>
);

export const Mic: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 19v3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <rect x="9" y="2" width="6" height="13" rx="3" />
  </IconBase>
);

export const MicOff: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 19v3" />
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
    <path d="M16.95 16.95A7 7 0 0 1 5 12v-2" />
    <path d="M18.89 13.23A7 7 0 0 0 19 12v-2" />
    <path d="m2 2 20 20" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
  </IconBase>
);

export const Minus: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M5 12h14" />
  </IconBase>
);

export const Navigation: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </IconBase>
);

export const Pause: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <rect x="14" y="3" width="5" height="18" rx="1" />
    <rect x="5" y="3" width="5" height="18" rx="1" />
  </IconBase>
);

export const Phone: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
  </IconBase>
);

export const PhoneCall: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M13 2a9 9 0 0 1 9 9" />
    <path d="M13 6a5 5 0 0 1 5 5" />
    <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
  </IconBase>
);

export const Pill: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </IconBase>
);

export const Play: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
  </IconBase>
);

export const Plus: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </IconBase>
);

export const Printer: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
    <rect x="6" y="14" width="12" height="8" rx="1" />
  </IconBase>
);

export const Radio: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M16.247 7.761a6 6 0 0 1 0 8.478" />
    <path d="M19.075 4.933a10 10 0 0 1 0 14.134" />
    <path d="M4.925 19.067a10 10 0 0 1 0-14.134" />
    <path d="M7.753 16.239a6 6 0 0 1 0-8.478" />
    <circle cx="12" cy="12" r="2" />
  </IconBase>
);

export const RefreshCw: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </IconBase>
);

export const RotateCcw: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </IconBase>
);

export const Scan: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
  </IconBase>
);

export const Send: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
    <path d="m21.854 2.147-10.94 10.939" />
  </IconBase>
);

export const ShieldAlert: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </IconBase>
);

export const ShieldCheck: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);

export const Sparkles: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    <path d="M20 2v4" />
    <path d="M22 4h-4" />
    <circle cx="4" cy="20" r="2" />
  </IconBase>
);

export const Stethoscope: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M11 2v2" />
    <path d="M5 2v2" />
    <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
    <path d="M8 15a6 6 0 0 0 12 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </IconBase>
);

export const Thermometer: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
  </IconBase>
);

export const TrafficCone: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M16.05 10.966a5 2.5 0 0 1-8.1 0" />
    <path d="m16.923 14.049 4.48 2.04a1 1 0 0 1 .001 1.831l-8.574 3.9a2 2 0 0 1-1.66 0l-8.574-3.91a1 1 0 0 1 0-1.83l4.484-2.04" />
    <path d="M16.949 14.14a5 2.5 0 1 1-9.9 0L10.063 3.5a2 2 0 0 1 3.874 0z" />
    <path d="M9.194 6.57a5 2.5 0 0 0 5.61 0" />
  </IconBase>
);

export const Trash2: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </IconBase>
);

export const Truck: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </IconBase>
);

export const Upload: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 3v12" />
    <path d="m17 8-5-5-5 5" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  </IconBase>
);

export const User: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </IconBase>
);

export const UserCheck: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="m16 11 2 2 4-4" />
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </IconBase>
);

export const UserPlus: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" x2="19" y1="8" y2="14" />
    <line x1="22" x2="16" y1="11" y2="11" />
  </IconBase>
);

export const Wind: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
    <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
    <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
  </IconBase>
);

export const X: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </IconBase>
);

export const Zap: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
  </IconBase>
);
