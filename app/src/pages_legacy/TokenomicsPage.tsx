import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { useMemo } from 'react'
import { Bar,Doughnut } from 'react-chartjs-2'

import { TOKEN_DECIMALS } from '@/constants/token'
import { TOKENOMICS_ALLOCATION, TOKENOMICS_TOTAL_SUPPLY_CET, tokenomicsAmountForPct, tokenomicsTextByLang } from '@/data/tokenomics'
import { useLanguage } from '@/hooks/useLanguage'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function TokenomicsPage() {
  const { lang, t } = useLanguage()

  const distribution = useMemo(() => {
    const labels = TOKENOMICS_ALLOCATION.map((d) => tokenomicsTextByLang(lang, d.label))
    const pct = TOKENOMICS_ALLOCATION.map((d) => d.pct)
    const colors = TOKENOMICS_ALLOCATION.map((d) => d.color)
    const amounts = TOKENOMICS_ALLOCATION.map((d) => tokenomicsAmountForPct(TOKENOMICS_TOTAL_SUPPLY_CET, d.pct))
    return { labels, pct, colors, amounts }
  }, [lang])

  const doughnutData = useMemo(
    () => ({
      labels: distribution.labels,
      datasets: [
        {
          label: 'CET %',
          data: distribution.pct,
          backgroundColor: distribution.colors,
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          hoverOffset: 10,
        },
      ],
    }),
    [distribution],
  )

  const barData = useMemo(
    () => ({
      labels: distribution.labels,
      datasets: [
        {
          label: 'CET',
          data: distribution.amounts,
          backgroundColor: distribution.colors.map((c) => `${c}CC`),
          borderColor: distribution.colors,
          borderWidth: 1,
        },
      ],
    }),
    [distribution],
  )

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold tracking-tight">Tokenomics</h1>
            <p className="mt-2 text-white/70 text-sm">Distribuție CET și sumar cantitativ (Chart.js).</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
              Home
            </a>
            <a href="/wallet" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
              Wallet
            </a>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-xs text-white/60 font-mono">Distribuție (%)</div>
            <div className="mt-4 h-[320px]">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.75)' } },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const i = ctx.dataIndex
                          const pct = distribution.pct[i] ?? 0
                          const amt = distribution.amounts[i] ?? 0
                          return `${ctx.label}: ${pct.toFixed(2)}% · ${amt.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET`
                        },
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="mt-4 text-xs text-white/60">Total supply: <span className="font-mono">{TOKENOMICS_TOTAL_SUPPLY_CET.toLocaleString()} CET</span></div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-xs text-white/60 font-mono">Distribuție (CET)</div>
            <div className="mt-4 h-[320px]">
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                    y: { ticks: { color: 'rgba(255,255,255,0.7)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
                  },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const v = Number(ctx.raw)
                          return `${v.toLocaleString(undefined, { maximumFractionDigits: TOKEN_DECIMALS })} CET`
                        },
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOKENOMICS_ALLOCATION.map((d) => (
                <div key={d.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-xs text-white font-semibold" style={{ color: d.color }}>{tokenomicsTextByLang(lang, d.label)}</div>
                  <div className="mt-1 text-[11px] text-white/60">{tokenomicsTextByLang(lang, d.unlock)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-white/60 font-mono">{t.tokenomicsUi?.chartConfigNote ?? ''}</div>
      </div>
    </main>
  )
}

