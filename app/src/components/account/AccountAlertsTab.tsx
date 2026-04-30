import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type Alert = {
  id: string;
  asset: string;
  direction: 'above' | 'below';
  targetUsd: string;
  channel: 'email' | 'push';
  cooldownMinutes: number;
  lastSentAt: string | null;
  createdAt: string;
};

type Props = {
  loading: boolean;
  alerts: Alert[];
  editingId: string | null;
  asset: 'CET' | 'TON';
  setAsset: (v: 'CET' | 'TON') => void;
  direction: 'above' | 'below';
  setDirection: (v: 'above' | 'below') => void;
  targetUsd: string;
  setTargetUsd: (v: string) => void;
  channel: 'email' | 'push';
  setChannel: (v: 'email' | 'push') => void;
  cooldownMinutes: number;
  setCooldownMinutes: (v: number) => void;
  onUpsert: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onStartEdit: (a: Alert) => void;
};

export default function AccountAlertsTab(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white font-semibold">Creează / editează alertă</div>
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <div className="text-xs text-white/60">Asset</div>
            <ToggleGroup
              type="single"
              value={props.asset}
              onValueChange={(v) => {
                if (v === 'CET' || v === 'TON') props.setAsset(v);
              }}
              className="mt-2 justify-start"
            >
              <ToggleGroupItem value="CET">CET</ToggleGroupItem>
              <ToggleGroupItem value="TON">TON</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <div className="text-xs text-white/60">Direcție</div>
            <ToggleGroup
              type="single"
              value={props.direction}
              onValueChange={(v) => {
                if (v === 'above' || v === 'below') props.setDirection(v);
              }}
              className="mt-2 justify-start"
            >
              <ToggleGroupItem value="above">↑ Peste</ToggleGroupItem>
              <ToggleGroupItem value="below">↓ Sub</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <div className="text-xs text-white/60">Prag (USD)</div>
            <Input value={props.targetUsd} onChange={(e) => props.setTargetUsd(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <div className="text-xs text-white/60">Canal</div>
            <ToggleGroup
              type="single"
              value={props.channel}
              onValueChange={(v) => {
                if (v === 'email' || v === 'push') props.setChannel(v);
              }}
              className="mt-2 justify-start"
            >
              <ToggleGroupItem value="email">Email</ToggleGroupItem>
              <ToggleGroupItem value="push">Telegram</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <div className="text-xs text-white/60">Cooldown (minute)</div>
            <Input
              value={String(props.cooldownMinutes)}
              onChange={(e) => props.setCooldownMinutes(Math.max(1, Math.min(1440, Number(e.target.value) || 60)))}
              inputMode="numeric"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={props.onUpsert} className="rounded-xl">
              {props.editingId ? 'Salvează' : 'Creează'}
            </Button>
            {props.editingId ? (
              <Button
                variant="outline"
                onClick={props.onCancelEdit}
                className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Renunță
              </Button>
            ) : null}
          </div>
          <div className="text-xs text-white/55">Job cron: `/api/jobs/price-alerts` + `/api/jobs/email-outbox`.</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-white font-semibold">Alertele tale</div>
          <div className="text-xs text-white/55">{props.loading ? 'Se încarcă…' : `${props.alerts.length} total`}</div>
        </div>
        <div className="mt-4 space-y-3">
          {props.alerts.length === 0 ? (
            <div className="text-sm text-white/60">Nu ai alerte încă.</div>
          ) : (
            props.alerts.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 flex items-center justify-between gap-3"
              >
                <button type="button" onClick={() => props.onStartEdit(a)} className="text-left min-w-0">
                  <div className="text-sm text-white font-semibold truncate">
                    {a.asset} {a.direction === 'above' ? '↑' : '↓'} ${a.targetUsd}
                  </div>
                  <div className="text-[11px] text-white/55 truncate">
                    {a.channel === 'email' ? 'Email' : 'Telegram'} · Cooldown: {a.cooldownMinutes}m
                  </div>
                </button>
                <Button
                  variant="outline"
                  onClick={() => props.onDelete(a.id)}
                  className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
