import type { Params } from '@shared/types'

export interface ValidationIssue {
  id: string
  message: string
  fields: (keyof Params)[]
}

// Largest radius a flat-ended spoke/blade box can reach without its
// corners poking past the tyre bead seat (hub_od/2). Mirrors
// wheel.py's _spoke_outer_radius() — keep in sync.
function spokeOuterRadius(hubOd: number, width: number): number {
  return Math.sqrt(Math.max(0, (hubOd / 2 - 0.2) ** 2 - (width / 2) ** 2))
}

// Mirrors wheel.py's Params.check() so the UI can give instant feedback
// without waiting on a Python round trip. Keep in sync with wheel.py.
export function validateParams(p: Params): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!(p.flange_ext > 0)) {
    issues.push({
      id: 'flange-ext-positive',
      message: `Flange extension (${p.flange_ext}mm) must be positive.`,
      fields: ['flange_ext']
    })
  }

  if (!(p.hub_od - 2 * p.barrel_wall > p.axle_d + 2 * p.boss_wall)) {
    issues.push({
      id: 'barrel-too-small',
      message:
        'Barrel is too small to clear the axle boss. Increase hub Ø, or reduce barrel wall, boss wall, or axle Ø.',
      fields: ['hub_od', 'barrel_wall', 'axle_d', 'boss_wall']
    })
  }

  if (!(p.tyre_od / 2 - (p.hub_od + p.flange_ext) / 2 > p.tread_depth + 1)) {
    issues.push({
      id: 'tread-too-deep',
      message: `Tread (${p.tread_depth}mm deep) leaves too little tyre wall. Increase tyre Ø, decrease hub Ø / flange extension, or reduce tread depth.`,
      fields: ['tyre_od', 'hub_od', 'flange_ext', 'tread_depth']
    })
  }

  const bossR = p.axle_d / 2 + p.boss_wall
  const barrelId = p.hub_od - 2 * p.barrel_wall
  if (p.rim_style === 'spoked' || p.rim_style === 'sport3') {
    const width = p.rim_style === 'spoked' ? p.spoke_w : p.blade_w
    const key = p.rim_style === 'spoked' ? 'spoke_w' : 'blade_w'
    const label = p.rim_style === 'spoked' ? 'Spoke width' : 'Blade width'

    if (!(width <= 2 * bossR)) {
      issues.push({
        id: `${key}-too-wide-boss`,
        message: `${label} (${width}mm) is too wide for the hub boss (max ${(2 * bossR).toFixed(1)}mm). Reduce ${label.toLowerCase()} or increase axle Ø / boss wall.`,
        fields: [key, 'axle_d', 'boss_wall']
      })
    } else if (!(spokeOuterRadius(p.hub_od, width) > barrelId / 2 + 0.5)) {
      issues.push({
        id: `${key}-too-wide-barrel`,
        message: `${label} (${width}mm) is too wide to reach the barrel wall. Reduce ${label.toLowerCase()}, increase hub Ø, or reduce barrel wall.`,
        fields: [key, 'hub_od', 'barrel_wall']
      })
    }
  }

  return issues
}

export function fieldsWithErrors(issues: ValidationIssue[]): Set<string> {
  const set = new Set<string>()
  for (const issue of issues) for (const field of issue.fields) set.add(field)
  return set
}

export function issuesForGroup(
  issues: ValidationIssue[],
  groupFieldKeys: string[]
): ValidationIssue[] {
  const keys = new Set(groupFieldKeys)
  return issues.filter((issue) => issue.fields.some((field) => keys.has(field)))
}
