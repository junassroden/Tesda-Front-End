// Small in-house icon set: 24px grid, 1.75 stroke, round caps.
// Kept inline so the app needs no icon library.
const PATHS = {
  dashboard: ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 10h7v10h-7z', 'M4 13h7v7H4z'],
  documents: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5', 'M9 13h6', 'M9 17h4'],
  inventory: ['M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z', 'M3.5 7.5 12 12l8.5-4.5', 'M12 12v9'],
  allowance: ['M4 7a2 2 0 0 1 2-2h11v4', 'M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2z', 'M16.5 14h.01'],
  programs: ['M2 9l10-5 10 5-10 5z', 'M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5', 'M22 9v6'],
  request: ['M9 3.5h6v3H9z', 'M9 5H6.5a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H15', 'M9 12h6', 'M9 16h4'],
  coins: ['M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3z', 'M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6', 'M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6'],
  truck: ['M3 6h11v10H3z', 'M14 9h4l3 3v4h-7', 'M7.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', 'M17.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  logout: ['M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3', 'M10 8l-4 4 4 4', 'M6 12h10'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-4-4'],
  download: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14'],
  arrowLeft: ['M19 12H5', 'M11 6l-6 6 6 6'],
  alert: ['M10.3 4.3 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z', 'M12 9.5v4', 'M12 17h.01'],
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  more: ['M12 5.5h.01', 'M12 12h.01', 'M12 18.5h.01'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  shield: ['M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z', 'M9 12l2 2 4-4'],
  refresh: ['M20 11a8 8 0 0 0-14.9-3.9L4 8', 'M4 4v4h4', 'M4 13a8 8 0 0 0 14.9 3.9L20 16', 'M20 20v-4h-4'],
  users: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1', 'M16 3.5a4 4 0 0 1 0 7.5', 'M22 21v-1a6 6 0 0 0-4-5.6'],
  image: ['M4 5h16v14H4z', 'M4 16l5-5 4 4 2-2 5 5', 'M15.5 9.5h.01'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  share: ['M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M8.6 13.5l6.8 4', 'M15.4 6.5l-6.8 4'],
  eye: ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  eyeOff: ['M3 3l18 18', 'M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1', 'M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'],
  inbox: ['M3 13l3-8h12l3 8v6H3z', 'M3 13h5l1 2h6l1-2h5'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  camera: ['M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  upload: ['M12 15V4', 'M7 9l5-5 5 5', 'M5 20h14'],
  trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13', 'M10 11v6', 'M14 11v6'],
  edit: ['M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z', 'M13.5 6.5l4 4'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  minus: ['M5 12h14'],
  chevronUp: ['M6 15l6-6 6 6'],
  chevronDown: ['M6 9l6 6 6-6'],
  expand: ['M4 9V4h5', 'M20 9V4h-5', 'M4 15v5h5', 'M20 15v5h-5'],
  collapse: ['M9 4v5H4', 'M15 4v5h5', 'M9 20v-5H4', 'M15 20v-5h5'],
  sparkle: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', 'M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z'],
}

/** <Icon name="documents" size={20} /> . Decorative by default; pass label to announce it. */
export default function Icon({ name, size = 20, label, className = '' }) {
  const paths = PATHS[name]
  if (!paths) return null
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 3 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
