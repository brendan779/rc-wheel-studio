import { AlertCircleIcon } from '../icons'

export function InlineError({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="mt-1 flex items-start gap-1.5 rounded-[5px] border border-error-border bg-error-soft px-2.5 py-2">
      <span className="mt-px shrink-0 text-error">
        <AlertCircleIcon width={14} height={14} />
      </span>
      <span className="text-inline-error font-medium leading-[1.45] text-error">{message}</span>
    </div>
  )
}
