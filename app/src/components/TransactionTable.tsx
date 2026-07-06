import { ArrowUpDown,ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export type TransactionRow = {
  hash: string
  now: string
  type: string
  lt?: string
  amountNanoTon?: string
}

type SortKey = 'now' | 'type' | 'hash'
type SortDir = 'asc' | 'desc'

function normalizeTime(v: string): number {
  const n = Number.parseInt(v, 10)
  if (Number.isFinite(n) && n > 0) return n * 1000
  const t = Date.parse(v)
  return Number.isFinite(t) ? t : 0
}

export function TransactionTable({
  rows,
  tonscanBaseUrl,
  loading,
  error,
}: {
  rows: TransactionRow[]
  tonscanBaseUrl: string
  loading: boolean
  error: string | null
}) {
  const [sortKey, setSortKey] = useState<SortKey>('now')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'now') return dir * (normalizeTime(a.now) - normalizeTime(b.now))
      if (sortKey === 'type') return dir * a.type.localeCompare(b.type)
      return dir * a.hash.localeCompare(b.hash)
    })
    return copy
  }, [rows, sortDir, sortKey])

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(k)
    setSortDir('asc')
  }

  return (
    <div className="overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="text-xs text-white/60 font-mono">Sort: {sortKey} ({sortDir})</div>
        {loading ? <div className="text-xs text-white/60">Loading…</div> : null}
      </div>

      {error ? <div className="p-4 text-white/70">Eroare: {error}</div> : null}
      {!error && sorted.length === 0 && !loading ? <div className="p-4 text-white/70">Fără rezultate.</div> : null}

      {sorted.length ? (
        <Table className="text-white/90">
          <TableHeader className="bg-black/20">
            <TableRow className="border-white/10">
              <TableHead className="text-white/70">
                <button
                  type="button"
                  className="inline-flex items-center gap-2"
                  onClick={() => toggleSort('hash')}
                  aria-label="Sortează după hash"
                >
                  Hash <ArrowUpDown className="w-3 h-3" aria-hidden />
                </button>
              </TableHead>
              <TableHead className="text-white/70">
                <button
                  type="button"
                  className="inline-flex items-center gap-2"
                  onClick={() => toggleSort('type')}
                  aria-label="Sortează după tip"
                >
                  Tip <ArrowUpDown className="w-3 h-3" aria-hidden />
                </button>
              </TableHead>
              <TableHead className="text-white/70">
                <button
                  type="button"
                  className="inline-flex items-center gap-2"
                  onClick={() => toggleSort('now')}
                  aria-label="Sortează după dată"
                >
                  Dată <ArrowUpDown className="w-3 h-3" aria-hidden />
                </button>
              </TableHead>
              <TableHead className="text-white/70 text-right">Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((tx) => (
              <TableRow key={tx.hash} className="border-white/10 hover:bg-white/[0.03]">
                <TableCell className="font-mono text-xs max-w-[26ch] truncate">{tx.hash}</TableCell>
                <TableCell className="text-xs text-white/70">{tx.type}</TableCell>
                <TableCell className="text-xs text-white/70">{tx.now}</TableCell>
                <TableCell className="text-right">
                  <a
                    href={`${tonscanBaseUrl}/tx/${encodeURIComponent(tx.hash)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                    aria-label="Open on TONScan"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </div>
  )
}

