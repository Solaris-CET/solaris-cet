import {
  AlertCircle, Camera, CheckCircle2, ClipboardList, Download, FileText,
  Loader2, MapPin, Send, Sun, Users, WifiOff, ArrowRight,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SolarisFooter } from '@/components/company/SolarisFooter';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  type ChecklistStatus,
  type BatchJobInput,
  type BatchRunResult,
  type DashboardData,
  type GenerateReportResult,
  type InstallerProfile,
  type JurisdictionItem,
  type SurveyFormData,
  fetchJurisdictions,
  fetchSurveyDashboard,
  fetchSurveyHealth,
  generateDemoReport,
  generateSurveyReport,
  runSurveyBatch,
  fetchOrchestration,
  permitPackUrl,
  submitSurveyCorrection,
  submitSurveyToCrm,
} from '@/lib/surveyApi';
import { applySurveyPrefill, parseSurveySearchParams } from '@/lib/surveyPrefill';
import {
  clearSurveyDraft,
  enqueuePendingReport,
  listPendingReports,
  loadSurveyDraft,
  removePendingReport,
  saveSurveyDraft,
  storedToPhotos,
} from '@/lib/surveyDraftStorage';
import { permitHintMessage, shouldAutoCrm, type SurveyOrchestration } from '@/lib/surveyAgent';
import { buildSurveyContactUrl } from '@/lib/contactPrefill';
import { cn } from '@/lib/utils';

const ROOF_TYPES = [
  { value: 'tile', label: 'Țiglă' },
  { value: 'metal', label: 'Tablă' },
  { value: 'flat', label: 'Plat' },
  { value: 'slate', label: 'Ardezie' },
  { value: 'other', label: 'Altul' },
];

const ORIENTATIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const SHADING = ['none', 'low', 'moderate', 'high', 'severe'] as const;
const GRID = [
  { value: 'single-phase', label: 'Monofazat' },
  { value: 'three-phase', label: 'Trifazat' },
] as const;
const STATUS: ChecklistStatus[] = ['pass', 'warning', 'fail', 'na'];

const DEFAULT_FORM: SurveyFormData = {
  clientName: '',
  clientAddress: '',
  clientCity: '',
  clientPostal: '',
  clientPhone: '',
  clientEmail: '',
  jurisdictionCode: '',
  siteLatitude: null,
  siteLongitude: null,
  roofType: 'tile',
  roofOrientation: 'S',
  roofPitch: 35,
  usableAreaM2: 42,
  annualConsumptionKwh: 4800,
  gridConnection: 'single-phase',
  shadingLevel: 'low',
  existingSolar: false,
  structuralNotes: '',
  premium: false,
  checklist: {
    struct: 'pass',
    electric: 'pass',
    shading: 'warning',
    access: 'pass',
    docs: 'pass',
    compliance: 'warning',
  },
};

const DEFAULT_INSTALLER: InstallerProfile = {
  installerId: '',
  installerName: '',
  company: 'Solaris CET',
};

function statusLabel(s: ChecklistStatus): string {
  return { pass: 'OK', warning: 'Atenție', fail: 'Eșuat', na: 'N/A' }[s];
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${pct} 100`} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{score}</span>
        <span className="text-[10px] text-white/50">/100</span>
      </div>
    </div>
  );
}

export default function SurveyPage() {
  const online = useOnlineStatus();
  const [tab, setTab] = useState<'report' | 'dashboard' | 'batch'>('report');
  const [installer, setInstaller] = useLocalStorage<InstallerProfile>('solaris_installer_profile', DEFAULT_INSTALLER);
  const [form, setForm] = useState<SurveyFormData>(DEFAULT_FORM);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<GenerateReportResult | null>(null);
  const [crmSent, setCrmSent] = useState(false);
  const [correctionField, setCorrectionField] = useState('verdict');
  const [correctionText, setCorrectionText] = useState('');
  const [correctionSent, setCorrectionSent] = useState(false);
  const [correctionSaving, setCorrectionSaving] = useState(false);
  const [orchestration, setOrchestration] = useState<SurveyOrchestration | null>(null);
  const [engineOk, setEngineOk] = useState<boolean | null>(null);
  const [costBudgetAlert, setCostBudgetAlert] = useState(false);
  const [batchManifest, setBatchManifest] = useState(
    '[{"job_id":"site1","client_name":"Client A","client_city":"Cluj-Napoca"}]',
  );
  const [batchPhotos, setBatchPhotos] = useState<File[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchRunResult | null>(null);
  const [calcPrefillNote, setCalcPrefillNote] = useState('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [jurisdictions, setJurisdictions] = useState<JurisdictionItem[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOfflineRef = useRef(false);
  const autoSyncStartedRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const items = await listPendingReports();
    setPendingCount(items.length);
  }, []);

  const handleSyncPending = useCallback(async () => {
    if (!online || syncing) return;
    setSyncing(true);
    setError('');
    try {
      const pending = await listPendingReports();
      if (!pending.length) {
        setPendingCount(0);
        return;
      }
      setProgress(`Sincronizare ${pending.length} raport(e)...`);
      for (const item of pending) {
        const res = await generateSurveyReport(
          storedToPhotos(item.photos),
          item.form,
          item.installer,
        );
        await removePendingReport(item.id);
        setResult(res);
      }
      await clearSurveyDraft();
      setPendingCount(0);
      setProgress('Sincronizare completă!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sincronizare eșuată');
    } finally {
      setSyncing(false);
      setProgress('');
      refreshPendingCount();
    }
  }, [online, syncing, refreshPendingCount]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const draft = await loadSurveyDraft();
      if (cancelled || !draft) {
        setDraftReady(true);
        return;
      }
      setForm(draft.form);
      setInstaller(draft.installer);
      const restored = storedToPhotos(draft.photos);
      setPhotos(restored);
      setPreviews(restored.map((f) => URL.createObjectURL(f)));
      setDraftSavedAt(draft.updatedAt);
      setDraftReady(true);
    })();
    refreshPendingCount();
    return () => {
      cancelled = true;
    };
  }, [refreshPendingCount, setInstaller]);

  useEffect(() => {
    const prefill = parseSurveySearchParams(window.location.search);
    if (!prefill.source) return;
    setForm((prev) => applySurveyPrefill(prev, prefill));
    setCalcPrefillNote('Date precompletate din calculator solar.');
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveSurveyDraft(form, installer, photos)
        .then(() => setDraftSavedAt(new Date().toISOString()))
        .catch(() => void 0);
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draftReady, form, installer, photos]);

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true;
      return;
    }
    fetchSurveyHealth()
      .then((h) => {
        setEngineOk(Boolean(h.engine?.ok));
        setCostBudgetAlert(Boolean(h.engine?.cost_budget?.alert || h.engine?.cost_budget?.exceeded));
      })
      .catch(() => setEngineOk(false));
    refreshPendingCount();
    if (wasOfflineRef.current && pendingCount > 0 && !autoSyncStartedRef.current) {
      autoSyncStartedRef.current = true;
      void handleSyncPending().finally(() => {
        autoSyncStartedRef.current = false;
        wasOfflineRef.current = false;
      });
    } else if (online) {
      wasOfflineRef.current = false;
    }
  }, [online, pendingCount, refreshPendingCount, handleSyncPending]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({
          type: 'PREFETCH_URLS',
          urls: ['/offline-ro.html', '/offline-image.svg', '/icon-192.png'],
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!online) return;
    fetchJurisdictions()
      .then(setJurisdictions)
      .catch(() => setJurisdictions([]));
  }, [online]);

  useEffect(() => {
    if (tab !== 'dashboard') return;
    fetchSurveyDashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, [tab]);

  const updateForm = useCallback(<K extends keyof SurveyFormData>(key: K, value: SurveyFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateChecklist = useCallback((key: keyof SurveyFormData['checklist'], value: ChecklistStatus) => {
    setForm((prev) => ({ ...prev, checklist: { ...prev.checklist, [key]: value } }));
  }, []);

  const addPhotos = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;
    setPhotos((prev) => {
      const next = [...prev, ...incoming].slice(0, 20);
      return next;
    });
    setPreviews((prev) => {
      const urls = incoming.map((f) => URL.createObjectURL(f));
      return [...prev, ...urls].slice(0, 20);
    });
    setError('');
  }, []);

  const handleGpsCapture = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocația nu este disponibilă pe acest dispozitiv.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          siteLatitude: pos.coords.latitude,
          siteLongitude: pos.coords.longitude,
        }));
        setGpsLoading(false);
        setError('');
      },
      () => {
        setGpsLoading(false);
        setError('Nu am putut obține coordonatele GPS. Verifică permisiunile.');
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const canGenerate = useMemo(
    () => photos.length > 0 && form.clientName.trim().length >= 2 && form.clientCity.trim().length >= 2,
    [photos.length, form.clientName, form.clientCity],
  );

  const offerUrl = useMemo(() => {
    if (!result) return null;
    return buildSurveyContactUrl({
      reportId: result.report_id,
      clientName: form.clientName,
      clientPhone: form.clientPhone || undefined,
      clientEmail: form.clientEmail || undefined,
      clientCity: form.clientCity,
      capacityKwp: result.capacity_kwp,
      score: result.score,
      roofType: form.roofType,
      pdfFilename: result.pdf_filename,
    });
  }, [result, form]);

  const applyOrchestration = useCallback(async (res: GenerateReportResult) => {
    const plan = res.orchestration ?? (await fetchOrchestration(res.report_id).catch(() => null));
    setOrchestration(plan);
    if (plan && shouldAutoCrm(plan) && form.clientName) {
      try {
        await submitSurveyToCrm({
          report_id: res.report_id,
          pdf_filename: res.pdf_filename,
          client_name: form.clientName,
          client_phone: form.clientPhone || '—',
          client_email: form.clientEmail || undefined,
          client_city: form.clientCity,
          installer_id: installer.installerId || undefined,
          installer_name: installer.installerName || undefined,
          score: res.score,
          capacity_kwp: res.capacity_kwp,
        });
        setCrmSent(true);
      } catch {
        /* optional */
      }
    }
  }, [form, installer]);

  const handleDemo = async () => {
    setGenerating(true);
    setError('');
    setResult(null);
    setCrmSent(false);
    setOrchestration(null);
    setProgress('Generare raport demo...');
    try {
      const res = await generateDemoReport();
      setResult(res);
      if (res.orchestration) {
        setOrchestration(res.orchestration);
      } else {
        await applyOrchestration(res);
      }
      setProgress('Demo gata!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo eșuat');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      setError('Completează client, oraș și încarcă cel puțin o poză.');
      return;
    }
    if (!online) {
      try {
        await enqueuePendingReport(form, installer, photos);
        await refreshPendingCount();
        setError('');
        setProgress('Offline — raport salvat în coadă. Se sincronizează la reconectare.');
      } catch {
        setError('Nu am putut salva raportul offline.');
      }
      return;
    }
    setGenerating(true);
    setError('');
    setResult(null);
    setCrmSent(false);
    setOrchestration(null);
    setProgress('Pregătire upload...');
    try {
      setProgress('Analiză AI + generare PDF...');
      const res = await generateSurveyReport(photos, form, installer);
      setResult(res);
      setProgress('Agent: planificare pași...');
      if (res.orchestration) {
        setOrchestration(res.orchestration);
        if (shouldAutoCrm(res.orchestration)) {
          setProgress('Agent: trimitere CRM...');
          try {
            await submitSurveyToCrm({
              report_id: res.report_id,
              pdf_filename: res.pdf_filename,
              client_name: form.clientName,
              client_phone: form.clientPhone || '—',
              client_email: form.clientEmail || undefined,
              client_city: form.clientCity,
              installer_id: installer.installerId || undefined,
              installer_name: installer.installerName || undefined,
              score: res.score,
              capacity_kwp: res.capacity_kwp,
              notes: form.structuralNotes || undefined,
            });
            setCrmSent(true);
          } catch {
            /* CRM optional */
          }
        }
      } else {
        await applyOrchestration(res);
      }
      await clearSurveyDraft();
      setProgress('Gata!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la generare');
    } finally {
      setGenerating(false);
    }
  };

  const handleCrm = async () => {
    if (!result) return;
    try {
      await submitSurveyToCrm({
        report_id: result.report_id,
        pdf_filename: result.pdf_filename,
        client_name: form.clientName,
        client_phone: form.clientPhone || '—',
        client_email: form.clientEmail || undefined,
        client_city: form.clientCity,
        installer_id: installer.installerId || undefined,
        installer_name: installer.installerName || undefined,
        score: result.score,
        capacity_kwp: result.capacity_kwp,
        notes: form.structuralNotes || undefined,
      });
      setCrmSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CRM eșuat');
    }
  };

  const handleCorrection = async () => {
    if (!result || !correctionText.trim()) return;
    setCorrectionSaving(true);
    setError('');
    try {
      await submitSurveyCorrection(
        {
          report_id: result.report_id,
          field: correctionField,
          original: result.verdict,
          corrected: correctionText.trim(),
          notes: form.structuralNotes || undefined,
        },
        installer,
      );
      setCorrectionSent(true);
      setCorrectionText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Corecție eșuată');
    } finally {
      setCorrectionSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,.08),transparent_55%)]" />

      <main className="relative mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6">
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-4 py-1.5 text-xs font-semibold text-amber-300">
            <Sun className="h-3.5 w-3.5" />
            SOLARIS CET Survey v1.2
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
            Raport șantier în sub 20 min
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
            Încarcă poze, completează checklist-ul și generează raport PDF permit-ready cu analiză AI.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
            {!online && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-amber-200">
                <WifiOff className="h-3.5 w-3.5" />
                Offline — draft salvat local
              </span>
            )}
            {draftSavedAt && (
              <span className="text-white/40">
                Draft: {new Date(draftSavedAt).toLocaleString('ro-RO')}
              </span>
            )}
            {engineOk !== null && online && (
              <span className={engineOk ? 'text-emerald-400' : 'text-amber-400'}>
                {engineOk ? '● Survey engine conectat' : '● Mod demo — pornește survey-engine pe :8000'}
              </span>
            )}
          </div>
          {pendingCount > 0 && (
            <div className="mx-auto mt-4 flex max-w-md flex-col items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 sm:flex-row">
              <p className="text-sm text-amber-100">
                {pendingCount} raport(e) în așteptare
              </p>
              <button
                type="button"
                disabled={!online || syncing}
                onClick={handleSyncPending}
                className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40"
              >
                {syncing ? 'Se sincronizează...' : 'Sincronizează acum'}
              </button>
            </div>
          )}
        </header>

        {costBudgetAlert ? (
          <p className="mb-4 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
            Atenție: bugetul API survey este aproape epuizat. Verifică dashboard-ul costuri.
          </p>
        ) : null}
        {calcPrefillNote ? (
          <p className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm text-emerald-200">
            {calcPrefillNote}
          </p>
        ) : null}

        <div className="mb-6 flex gap-2 rounded-2xl border border-white/10 bg-white/[.03] p-1">
          {(['report', 'dashboard', 'batch'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                tab === t ? 'bg-amber-400/15 text-amber-200' : 'text-white/50 hover:text-white/80',
              )}
            >
              {t === 'report' ? 'Raport nou' : t === 'dashboard' ? 'Dashboard' : 'Batch'}
            </button>
          ))}
        </div>

        {tab === 'batch' ? (
          <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Batch — mai multe șantiere</h2>
              <p className="mt-1 text-sm text-white/55">
                Manifest JSON + poze denumite <code className="text-amber-200/90">job_id__foto.jpg</code> (ex: site1__acoperis.jpg)
              </p>
            </div>
            <textarea
              value={batchManifest}
              onChange={(e) => setBatchManifest(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white"
            />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setBatchPhotos(e.target.files ? Array.from(e.target.files) : [])}
              className="block w-full text-sm text-white/70"
            />
            {batchPhotos.length > 0 ? (
              <p className="text-xs text-white/45">{batchPhotos.length} fișiere selectate</p>
            ) : null}
            <button
              type="button"
              disabled={batchRunning || !online || !batchPhotos.length}
              onClick={async () => {
                setBatchRunning(true);
                setError('');
                try {
                  const manifest = JSON.parse(batchManifest) as BatchJobInput[];
                  const result = await runSurveyBatch(manifest, batchPhotos, installer);
                  setBatchResult(result);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Batch eșuat');
                } finally {
                  setBatchRunning(false);
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-black disabled:opacity-40"
            >
              {batchRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
              {batchRunning ? 'Batch în curs...' : 'Rulează batch'}
            </button>
            {batchResult ? (
              <div className="space-y-2 text-sm">
                <p className="text-white/70">
                  {batchResult.succeeded}/{batchResult.total} reușite · {batchResult.failed} eșuate
                </p>
                {batchResult.results.map((r) => (
                  <div key={r.job_id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <p className="font-mono text-xs text-white/50">{r.job_id}</p>
                    {r.success ? (
                      <p className="text-emerald-300">
                        {r.report_id} · scor {r.score}/100
                        {r.pdf_url ? (
                          <a href={r.pdf_url} className="ml-2 text-amber-300 hover:underline">PDF</a>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-red-300">{r.error || 'Eșuat'}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : tab === 'report' ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-200">
                  <Users className="h-4 w-4" />
                  Profil tehnician / instalator
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="block text-xs text-white/50">
                    ID instalator
                    <input
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={installer.installerId}
                      onChange={(e) => setInstaller({ ...installer, installerId: e.target.value })}
                      placeholder="INST-001"
                    />
                  </label>
                  <label className="block text-xs text-white/50">
                    Nume tehnician
                    <input
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={installer.installerName}
                      onChange={(e) => setInstaller({ ...installer, installerName: e.target.value })}
                      placeholder="Alexandru P."
                    />
                  </label>
                  <label className="block text-xs text-white/50">
                    Companie
                    <input
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={installer.company}
                      onChange={(e) => setInstaller({ ...installer, company: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-white/50">
                    Cheie API instalator
                    <input
                      type="password"
                      autoComplete="off"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={installer.installerApiKey ?? ''}
                      onChange={(e) => setInstaller({ ...installer, installerApiKey: e.target.value })}
                      placeholder="Opțional — producție SaaS"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-200">
                  <Camera className="h-4 w-4" />
                  Poze șantier ({photos.length}/20)
                </div>
                <div
                  className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center transition hover:border-amber-400/40"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files); }}
                >
                  <Camera className="mb-2 h-8 w-8 text-white/30" />
                  <p className="text-sm text-white/60">Apasă sau trage poze aici</p>
                  <p className="mt-1 text-xs text-white/35">Acoperiș, tablou, umbrire, acces</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && addPhotos(e.target.files)}
                  />
                </div>
                {previews.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {previews.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        className="group relative aspect-square overflow-hidden rounded-lg border border-white/10"
                        onClick={() => removePhoto(i)}
                        title="Elimină"
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100 text-xs">✕</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-200">
                  <ClipboardList className="h-4 w-4" />
                  Date client & șantier
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    ['clientName', 'Nume client', 'text'],
                    ['clientPhone', 'Telefon', 'tel'],
                    ['clientEmail', 'Email', 'email'],
                    ['clientAddress', 'Adresă', 'text'],
                    ['clientCity', 'Oraș', 'text'],
                    ['clientPostal', 'Cod poștal', 'text'],
                  ] as const).map(([key, label, type]) => (
                    <label key={key} className="block text-xs text-white/50">
                      {label}
                      <input
                        type={type}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                        value={form[key]}
                        onChange={(e) => updateForm(key, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-white/50">
                    Județ / jurisdicție AHJ
                    <select
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={form.jurisdictionCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const j = jurisdictions.find((item) => item.code === code);
                        setForm((prev) => ({
                          ...prev,
                          jurisdictionCode: code,
                          clientCity: prev.clientCity.trim() || (j?.name ?? prev.clientCity),
                        }));
                      }}
                    >
                      <option value="">Auto (din oraș)</option>
                      {jurisdictions.map((j) => (
                        <option key={j.code} value={j.code}>
                          {j.name} — {j.grid_operator}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={handleGpsCapture}
                      disabled={gpsLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/80 transition hover:border-amber-400/30 hover:text-amber-200 disabled:opacity-50"
                    >
                      {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      {form.siteLatitude != null && form.siteLongitude != null
                        ? `GPS: ${form.siteLatitude.toFixed(4)}, ${form.siteLongitude.toFixed(4)}`
                        : 'Capturează GPS șantier'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="block text-xs text-white/50">
                    Acoperiș
                    <select
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={form.roofType}
                      onChange={(e) => updateForm('roofType', e.target.value)}
                    >
                      {ROOF_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs text-white/50">
                    Orientare
                    <select
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={form.roofOrientation}
                      onChange={(e) => updateForm('roofOrientation', e.target.value)}
                    >
                      {ORIENTATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs text-white/50">
                    Înclinare ({form.roofPitch}°)
                    <input
                      type="range" min={0} max={60} value={form.roofPitch}
                      className="mt-2 w-full accent-amber-400"
                      onChange={(e) => updateForm('roofPitch', Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="block text-xs text-white/50">
                    Suprafață m²
                    <input type="number" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={form.usableAreaM2} onChange={(e) => updateForm('usableAreaM2', Number(e.target.value))} />
                  </label>
                  <label className="block text-xs text-white/50">
                    Consum kWh/an
                    <input type="number" className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={form.annualConsumptionKwh} onChange={(e) => updateForm('annualConsumptionKwh', Number(e.target.value))} />
                  </label>
                  <label className="block text-xs text-white/50">
                    Umbrire
                    <select className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={form.shadingLevel} onChange={(e) => updateForm('shadingLevel', e.target.value)}>
                      {SHADING.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-white/50">
                    Rețea electrică
                    <select
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                      value={form.gridConnection}
                      onChange={(e) => updateForm('gridConnection', e.target.value)}
                    >
                      {GRID.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </label>
                  <label className="mt-6 flex items-center gap-2 text-sm text-white/70 sm:mt-0 sm:items-end sm:pb-2">
                    <input
                      type="checkbox"
                      checked={form.existingSolar}
                      onChange={(e) => updateForm('existingSolar', e.target.checked)}
                      className="accent-amber-400"
                    />
                    Solar existent pe acoperiș
                  </label>
                </div>
                <label className="mt-4 flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" checked={form.premium} onChange={(e) => updateForm('premium', e.target.checked)} className="accent-amber-400" />
                  Premium (Claude Fable 5) — top-tier 15–20%
                </label>
              </div>

              <details className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                <summary className="cursor-pointer text-sm font-semibold text-amber-200">Checklist tehnic</summary>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {([
                    ['struct', 'Structură'],
                    ['electric', 'Electric'],
                    ['shading', 'Umbrire'],
                    ['access', 'Acces'],
                    ['docs', 'Documentație'],
                    ['compliance', 'Conformitate'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="block text-xs text-white/50">
                      {label}
                      <select
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                        value={form.checklist[key]}
                        onChange={(e) => updateChecklist(key, e.target.value as ChecklistStatus)}
                      >
                        {STATUS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <label className="mt-3 block text-xs text-white/50">
                  Note structurale
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    rows={3}
                    value={form.structuralNotes}
                    onChange={(e) => updateForm('structuralNotes', e.target.value)}
                  />
                </label>
              </details>
            </section>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                <button
                  type="button"
                  disabled={generating || !canGenerate}
                  onClick={handleGenerate}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {generating
                    ? 'Se generează...'
                    : online
                      ? 'Generează Raport PDF'
                      : 'Salvează în coadă (offline)'}
                </button>
                <button
                  type="button"
                  disabled={generating || !online}
                  onClick={handleDemo}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:border-amber-400/30 hover:text-white disabled:opacity-40"
                >
                  Raport demo (fără poze)
                </button>
                {progress && generating && (
                  <p className="mt-3 text-center text-xs text-white/50">{progress}</p>
                )}
                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              {result && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={result.score} />
                    <div>
                      <p className="text-xs text-white/50">Raport</p>
                      <p className="font-mono text-sm text-white">{result.report_id}</p>
                      <p className="mt-1 text-sm text-emerald-300">{result.verdict}</p>
                      <p className="mt-1 text-xs text-white/60">
                        {result.capacity_kwp} kWp · {Math.round(result.annual_kwh).toLocaleString('ro-RO')} kWh/an
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-white/45">{result.routing_reason} · ~${result.cost_usd.toFixed(4)} API</p>
                  {orchestration && permitHintMessage(orchestration) && (
                    <p className="mt-2 rounded-lg border border-teal-400/20 bg-teal-400/5 px-3 py-2 text-xs text-teal-200">
                      {permitHintMessage(orchestration)}
                    </p>
                  )}
                  {orchestration && (
                    <ul className="mt-2 space-y-1 text-[11px] text-white/50">
                      {orchestration.steps.filter((s) => s.status !== 'skipped').map((s) => (
                        <li key={s.id} className="flex items-center gap-2">
                          <span className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            s.status === 'done' ? 'bg-emerald-400' : s.status === 'blocked' ? 'bg-red-400' : 'bg-amber-400',
                          )} />
                          {s.label}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 flex flex-col gap-2">
                    <a
                      href={result.pdf_url}
                      download
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-amber-400/30"
                    >
                      <Download className="h-4 w-4" />
                      Descarcă PDF
                    </a>
                    <a
                      href={result.ahj_url}
                      download
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:text-white"
                    >
                      Export AHJ JSON
                    </a>
                    <a
                      href={permitPackUrl(result.report_id)}
                      download
                      className="flex items-center justify-center gap-2 rounded-xl border border-teal-400/20 bg-teal-400/5 px-4 py-2 text-xs font-semibold text-teal-200 transition hover:bg-teal-400/10"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Pachet autorizație (ZIP)
                    </a>
                    <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs font-semibold text-white/70">Corecție tehnician</p>
                      <select
                        value={correctionField}
                        onChange={(e) => setCorrectionField(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white"
                      >
                        <option value="verdict">Verdict</option>
                        <option value="capacity_kwp">Capacitate kWp</option>
                        <option value="shading">Umbrire</option>
                        <option value="checklist">Checklist</option>
                        <option value="other">Alt câmp</option>
                      </select>
                      <textarea
                        value={correctionText}
                        onChange={(e) => setCorrectionText(e.target.value)}
                        placeholder="Valoare corectată observată pe teren..."
                        rows={2}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white placeholder:text-white/30"
                      />
                      <button
                        type="button"
                        onClick={handleCorrection}
                        disabled={correctionSaving || correctionSent || !correctionText.trim()}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-amber-400/30 disabled:opacity-50"
                      >
                        {correctionSent ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ClipboardList className="h-3.5 w-3.5" />}
                        {correctionSent ? 'Corecție înregistrată' : correctionSaving ? 'Se salvează...' : 'Trimite corecție'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleCrm}
                      disabled={crmSent}
                      className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/15 disabled:opacity-50"
                    >
                      {crmSent ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      {crmSent ? 'Trimis în CRM' : 'Trimite în CRM'}
                    </button>
                    {offerUrl && (
                      <a
                        href={offerUrl}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Cere ofertă (contact)
                      </a>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
            {!dashboard ? (
              <p className="text-sm text-white/50">Dashboard indisponibil — verifică survey-engine.</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-4">
                  {[
                    ['Rapoarte', dashboard.stats.total_reports],
                    ['Scor mediu', `${dashboard.stats.avg_score}/100`],
                    ['Capacitate', `${dashboard.stats.total_capacity_kwp} kWp`],
                    ['Cost API', `$${dashboard.total_api_cost_usd.toFixed(2)}`],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                      <p className="text-xs text-white/45">{label}</p>
                      <p className="mt-1 text-xl font-black text-amber-200">{value}</p>
                    </div>
                  ))}
                </div>
                {(dashboard.by_installer && Object.keys(dashboard.by_installer).length > 0) && (
                  <>
                    <h3 className="mb-3 mt-6 text-sm font-semibold text-white/70">Per instalator</h3>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {Object.entries(dashboard.by_installer).map(([id, count]) => (
                        <span key={id} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
                          {id}: <strong className="text-amber-200">{count}</strong>
                        </span>
                      ))}
                    </div>
                  </>
                )}
                <h3 className="mb-3 mt-6 text-sm font-semibold text-white/70">Rapoarte recente</h3>
                <div className="space-y-2">
                  {dashboard.recent_reports.length === 0 && (
                    <p className="text-sm text-white/40">Niciun raport încă.</p>
                  )}
                  {dashboard.recent_reports.map((r) => (
                    <div key={r.report_id} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm">
                      <div>
                        <span className="font-mono text-xs text-white/45">{r.report_id}</span>
                        <p className="text-white">{r.client} · {r.city}</p>
                      </div>
                      <div className="text-right text-xs text-white/60">
                        <p className="font-bold text-amber-200">{r.score}/100</p>
                        <p>{r.kwp} kWp</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <SolarisFooter />
    </div>
  );
}