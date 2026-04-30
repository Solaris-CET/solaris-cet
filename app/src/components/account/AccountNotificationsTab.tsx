import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

type Props = {
  email: string;
  setEmail: (v: string) => void;
  marketingNewsletter: boolean;
  setMarketingNewsletter: (v: boolean) => void;
  priceAlertsEmail: boolean;
  setPriceAlertsEmail: (v: boolean) => void;
  pushEnabled: boolean;
  setPushEnabled: (v: boolean) => void;
  pushBusy: boolean;
  pushInfo: string | null;
  onEnablePush: () => void;
  onDisablePush: () => void;
  onTestPush: () => void;
  savingProfile: boolean;
  onSaveProfile: () => void;
};

export default function AccountNotificationsTab(props: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="text-white font-semibold">Email</div>
        <div className="mt-2 text-xs text-white/60">Folosit pentru newsletter și alerte.</div>
        <div className="mt-4 flex gap-2">
          <Input value={props.email} onChange={(e) => props.setEmail(e.target.value)} placeholder="nume@domeniu.com" />
          <Button onClick={props.onSaveProfile} disabled={props.savingProfile} className="rounded-xl">
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-white font-semibold">Newsletter</div>
            <div className="mt-1 text-xs text-white/60">Opt-in marketing + onboarding.</div>
          </div>
          <Switch checked={props.marketingNewsletter} onCheckedChange={props.setMarketingNewsletter} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-white font-semibold">Alerte pe email</div>
            <div className="mt-1 text-xs text-white/60">Primești notificări când pragul e atins.</div>
          </div>
          <Switch checked={props.priceAlertsEmail} onCheckedChange={props.setPriceAlertsEmail} />
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-white font-semibold">Push notifications</div>
              <div className="mt-1 text-xs text-white/60">Service worker separat: `/push/sw.js`.</div>
            </div>
            <Switch checked={props.pushEnabled} onCheckedChange={props.setPushEnabled} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={props.onEnablePush} disabled={props.pushBusy || props.pushEnabled} className="rounded-xl">
              Activează
            </Button>
            <Button
              variant="outline"
              onClick={props.onTestPush}
              disabled={props.pushBusy || !props.pushEnabled}
              className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Testează
            </Button>
            <Button
              variant="outline"
              onClick={props.onDisablePush}
              disabled={props.pushBusy || !props.pushEnabled}
              className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Revocă
            </Button>
          </div>
          {props.pushInfo ? <div className="mt-3 text-xs text-white/60">{props.pushInfo}</div> : null}
        </div>
        <div className="mt-5">
          <Button onClick={props.onSaveProfile} disabled={props.savingProfile} className="rounded-xl">
            Salvează
          </Button>
        </div>
      </div>
    </div>
  );
}

