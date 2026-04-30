import { useEffect, useState } from 'react'

import { readJson, writeJson } from '@/lib/localJsonStore'

const KEY = 'solaris_data_saver'

function connectionSaveData(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  return Boolean(nav.connection?.saveData)
}

export function useDataSaver(): { enabled: boolean; setEnabled: (v: boolean) => void } {
  const [enabled, setEnabledState] = useState(() => {
    const stored = readJson<{ v?: unknown }>(KEY)
    if (typeof stored?.v === 'boolean') return stored.v
    if (typeof navigator === 'undefined') return false
    return connectionSaveData()
  })

  useEffect(() => {
    writeJson(KEY, { v: enabled })
  }, [enabled])

  const setEnabled = (v: boolean) => setEnabledState(Boolean(v))

  return { enabled, setEnabled }
}

