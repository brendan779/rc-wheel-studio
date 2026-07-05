import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { validateParams } from '../lib/validate'

let requestSeq = 0

/** Debounces param/tread changes, validates client-side first, then asks
 * the main process to (re)build a preview. Stale responses (superseded by
 * a newer request) are dropped. */
export function useLivePreview(): void {
  const params = useAppStore((s) => s.params)
  const tread = useAppStore((s) => s.tread)
  const latestRequestId = useRef<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const store = useAppStore.getState()
    const issues = validateParams(params)

    if (issues.length > 0) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      window.api.preview.cancel()
      store.setBuildState('error')
      store.setBuildError(
        issues[0].message,
        issues.flatMap((i) => i.fields)
      )
      return
    }

    store.setBuildState('debouncing')
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(() => {
      const requestId = String(++requestSeq)
      latestRequestId.current = requestId
      useAppStore.getState().setBuildState('building')

      window.api.preview.generate({ requestId, params, tread }).then((response) => {
        if (latestRequestId.current !== requestId) return // superseded
        const current = useAppStore.getState()
        if (response.ok) {
          current.setStlPaths(response.rimStlPaths, response.tyreStlPath)
          current.setBuildError(null)
          current.setBuildState('ready')
        } else {
          current.setBuildError(response.message, 'fields' in response ? response.fields : [])
          current.setBuildState('error')
        }
      })
    }, 400)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [params, tread])
}
