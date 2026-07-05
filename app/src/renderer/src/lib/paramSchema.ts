import type { Params, Tread } from '@shared/types'

export interface FieldSpec {
  key: keyof Params
  label: string
  unit: string
  min: number
  max: number
  step: number
  integer?: boolean
}

export interface GroupSpec {
  id: string
  title: string
  fields: (params: Params, tread: Tread) => FieldSpec[]
}

const f = (
  key: keyof Params,
  label: string,
  min: number,
  max: number,
  step: number,
  unit = 'mm',
  integer = false
): FieldSpec => ({ key, label, unit, min, max, step, integer })

export const GROUPS: GroupSpec[] = [
  {
    id: 'main',
    title: 'Main',
    fields: () => [
      f('tyre_od', 'Tyre diameter', 30, 120, 0.5),
      f('width', 'Wheel width', 6, 30, 0.5),
      f('hub_od', 'Hub diameter', 15, 60, 0.5),
      f('axle_d', 'Axle hole', 2, 10, 0.25)
    ]
  },
  {
    id: 'rim',
    title: 'Rim',
    fields: () => [
      f('flange_ext', 'Flange ext. (+hub Ø)', 0.5, 10, 0.1),
      f('flange_t', 'Flange thickness', 0.8, 4, 0.1),
      f('barrel_wall', 'Barrel wall', 1, 5, 0.1),
      f('web_t', 'Centre web thickness', 1, 5, 0.1),
      f('boss_wall', 'Axle boss wall', 1, 5, 0.1)
    ]
  },
  {
    id: 'rimStyleDetails',
    title: 'Rim style details',
    fields: (params) => {
      switch (params.rim_style) {
        case 'spoked':
          return [
            f('spoke_count', 'Spoke count', 3, 12, 1, '', true),
            f('spoke_w', 'Spoke width', 1.5, 8, 0.1)
          ]
        case 'sport3':
          return [f('blade_w', 'Blade width', 3, 15, 0.1)]
        case 'holes':
          return [f('hole_count', 'Hole count', 3, 12, 1, '', true)]
        case 'solid':
        default:
          return []
      }
    }
  },
  {
    id: 'tyreFit',
    title: 'Tyre fit',
    fields: () => [
      f('shoulder_r', 'Shoulder radius', 0.5, 6, 0.1),
      f('tyre_fit', 'Bore interference', -1, 0, 0.05),
      f('pocket_clear', 'Pocket clearance', 0.1, 1.5, 0.05),
      f('tread_depth', 'Tread depth', 0.5, 4, 0.1)
    ]
  },
  {
    id: 'treadDetails',
    title: 'Tread details',
    fields: (_params, tread) => {
      if (tread === 'offroad') {
        return [
          f('lug_count', 'Lug count', 6, 32, 1, '', true),
          f('lug_groove_w', 'Groove width', 1, 8, 0.1),
          f('chevron_ang', 'Chevron angle', 0, 45, 1, '°')
        ]
      }
      if (tread === 'tarmac') {
        return [
          f('rib_grooves', 'Rib grooves', 1, 6, 1, '', true),
          f('rib_groove_w', 'Rib groove width', 0.5, 3, 0.05),
          f('sipe_count', 'Sipe count', 10, 80, 1, '', true),
          f('sipe_w', 'Sipe width', 0.3, 1.5, 0.05),
          f('sipe_depth', 'Sipe depth', 0.3, 2, 0.05)
        ]
      }
      return []
    }
  }
]
