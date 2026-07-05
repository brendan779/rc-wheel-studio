import type { JSX, SVGProps } from 'react'

// Shared 18x18, 1.3px stroke, circles-and-lines icon set per the design
// handoff's iconography spec. currentColor throughout so components can
// tint via text color.
function Base(props: SVGProps<SVGSVGElement>): JSX.Element {
  const { children, ...rest } = props
  return (
    <svg
      viewBox="0 0 18 18"
      width={props.width ?? 15}
      height={props.height ?? 15}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function TreadSmoothIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      <circle cx="9" cy="9" r="3" />
    </Base>
  )
}

export function TreadOffroadIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  const dots: [number, number][] = [
    [9, 3.2],
    [13.5, 6],
    [13.5, 12],
    [9, 14.8],
    [4.5, 12],
    [4.5, 6]
  ]
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="0.9" fill="currentColor" stroke="none" />
      ))}
    </Base>
  )
}

export function TreadTarmacIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      <line x1="9" y1="3" x2="9" y2="15" />
      <line x1="3" y1="9" x2="15" y2="9" />
    </Base>
  )
}

export function RimSolidIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      <circle cx="9" cy="9" r="2" />
    </Base>
  )
}

export function RimHolesIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  const dots: [number, number][] = [
    [9, 4.2],
    [12.6, 11.4],
    [5.4, 11.4]
  ]
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      <circle cx="9" cy="9" r="1.6" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.1" />
      ))}
    </Base>
  )
}

export function RimSpokedIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      <circle cx="9" cy="9" r="2" />
      <line x1="9" y1="3" x2="9" y2="6.5" />
      <line x1="9" y1="11.5" x2="9" y2="15" />
      <line x1="3" y1="9" x2="6.5" y2="9" />
      <line x1="11.5" y1="9" x2="15" y2="9" />
    </Base>
  )
}

export function RimSport3Icon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      <circle cx="9" cy="9" r="2" />
      <line x1="9" y1="7.3" x2="9" y2="3" />
      <line x1="10.5" y1="10" x2="13.8" y2="12.5" />
      <line x1="7.5" y1="10" x2="4.2" y2="12.5" />
    </Base>
  )
}

export function ViewAssembledIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      <circle cx="9" cy="9" r="3.2" />
    </Base>
  )
}

export function ViewExplodedIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="6.5" r="4" />
      <circle cx="9" cy="14" r="2" />
    </Base>
  )
}

export function ViewSectionIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <ellipse cx="9" cy="9" rx="6.5" ry="6.5" />
      <ellipse cx="9" cy="9" rx="2.4" ry="6.5" />
      <line x1="9" y1="2.5" x2="9" y2="15.5" />
    </Base>
  )
}

export function ViewWireframeIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <ellipse cx="9" cy="9" rx="6.5" ry="6.5" />
      <ellipse cx="9" cy="9" rx="6.5" ry="2.4" />
      <line x1="2.5" y1="9" x2="15.5" y2="9" />
    </Base>
  )
}

export function ChevronIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base width={10} height={10} {...props}>
      <path d="M6 3.5 L11 9 L6 14.5" />
    </Base>
  )
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <line x1="9" y1="2.5" x2="9" y2="11" />
      <path d="M5.5 8 L9 11.5 L12.5 8" />
      <line x1="3.5" y1="15" x2="14.5" y2="15" />
    </Base>
  )
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      <path d="M5.7 9.2 L7.8 11.3 L12.3 6.6" />
    </Base>
  )
}

export function AlertCircleIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="6.5" />
      <line x1="9" y1="5.7" x2="9" y2="9.8" />
      <circle cx="9" cy="12.2" r="0.15" fill="currentColor" />
    </Base>
  )
}
