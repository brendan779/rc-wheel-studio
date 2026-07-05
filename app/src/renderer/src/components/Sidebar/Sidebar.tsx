import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { GROUPS } from '../../lib/paramSchema'
import { fieldsWithErrors, issuesForGroup, validateParams } from '../../lib/validate'
import { PresetDropdown } from './PresetDropdown'
import { ParamGroup } from './ParamGroup'
import { SliderField } from './SliderField'
import { InlineError } from './InlineError'
import { Toggle } from './Toggle'

export function Sidebar(): React.JSX.Element {
  const params = useAppStore((s) => s.params)
  const tread = useAppStore((s) => s.tread)
  const setParam = useAppStore((s) => s.setParam)

  const issues = useMemo(() => validateParams(params), [params])
  const errorFields = useMemo(() => fieldsWithErrors(issues), [issues])

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-border-subtle bg-bg-elevated">
      <div className="shrink-0 border-b border-border-subtle p-3.5">
        <PresetDropdown />
      </div>
      <div className="flex-1 overflow-y-auto">
        {GROUPS.map((group) => {
          const fields = group.fields(params, tread)
          if (fields.length === 0) return null
          const groupIssues = issuesForGroup(
            issues,
            fields.map((f) => f.key)
          )
          return (
            <ParamGroup key={group.id} title={group.title} error={groupIssues.length > 0}>
              {fields.map((field) => (
                <SliderField
                  key={field.key}
                  spec={field}
                  value={params[field.key] as number}
                  error={errorFields.has(field.key)}
                  onChange={(value) => setParam(field.key, value)}
                />
              ))}
              {group.id === 'rim' && (
                <Toggle
                  label="Split rim for gluing"
                  hint="Prints as two flat halves, no supports under spokes/blades — align with the axle rod when gluing."
                  checked={params.split_rim}
                  onChange={(checked) => setParam('split_rim', checked)}
                />
              )}
              {groupIssues.map((issue) => (
                <InlineError key={issue.id} message={issue.message} />
              ))}
            </ParamGroup>
          )
        })}
      </div>
    </aside>
  )
}
