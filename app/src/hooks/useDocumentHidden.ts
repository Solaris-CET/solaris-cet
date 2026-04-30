import { useEffect, useState } from 'react'

export function useDocumentHidden(): boolean {
  const [hidden, setHidden] = useState(() => (typeof document !== 'undefined' ? document.hidden : false))

  useEffect(() => {
    const onChange = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return hidden
}

