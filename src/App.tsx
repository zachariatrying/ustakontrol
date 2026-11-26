import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Check,
  Copy,
  Download,
  FileText,
  Hammer,
  Scale,
  Shield,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ContractorQuote,
  DEMO_QUOTES,
  RENOVATION_SCOPES,
  ScopeStatus,
} from './data/renovationScopes';
import {
  auditContractorQuotes,
  MUST_HAVE_CONTRACT_ITEMS,
} from './utils/quoteAuditor';

const STORAGE_KEY = 'ustakontrol_quotes_v1';
type Tab = 'compare' | 'matrix' | 'contract';

const STATUS_LABELS: Record<ScopeStatus, string> = {
  included: 'Dahil',
  excluded: 'Hariç',
  unclear: 'Belirsiz',
  owner: 'Ev Sahibi Alır',
};

export default function App() {
  const [quotes, setQuotes] = useState<ContractorQuote[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch {}
    return DEMO_QUOTES;
  });

  const [budget, setBudget] = useState<number>(100000);
  const [tab, setTab] = useState<Tab>('compare');
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    } catch {}
  }, [quotes]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const audited = useMemo(() => auditContractorQuotes(quotes), [quotes]);
  const bestQuote = audited[0];
  const maxRealistic = useMemo(() => Math.max(...audited.map((a) => a.realisticHigh), budget, 1), [audited, budget]);

  const updateQuoteField = <K extends keyof ContractorQuote>(id: string, key: K, value: ContractorQuote[K]) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, [key]: value } : q)));
  };

  const cycleScopeStatus = (quoteId: string, scopeId: string) => {
    const order: ScopeStatus[] = ['included', 'excluded', 'unclear', 'owner'];
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== quoteId) return q;
        const cur = q.scopes[scopeId] || 'unclear';
        const next = order[(order.indexOf(cur) + 1) % order.length];
        return { ...q, scopes: { ...q.scopes, [scopeId]: next } };
      })
    );
  };

  const downloadSummaryPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0E3A5D';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#E05319';
    ctx.fillRect(0, 0, 1080, 16);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('USTAKONTROL // TADİLAT PAFTA KARŞILAŞTIRMASI', 72, 96);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 46px system-ui, sans-serif';
    ctx.fillText(`Hedef Bütçe: ${budget.toLocaleString('tr-TR')} ₺`, 72, 180);

    audited.slice(0, 3).forEach((item, idx) => {
      const y = 245 + idx * 315;
      ctx.fillStyle = '#F4F7FA';
      ctx.fillRect(72, y, 936, 275);
      ctx.fillStyle = '#0E3A5D';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillText(`${item.quote.label} · ${item.quote.contractorName} (${item.score}/100)`, 108, y + 60);
      ctx.font = '24px monospace';
      ctx.fillText(`Yazılı: ${item.quote.quotedTotal.toLocaleString('tr-TR')} ₺ | Peşinat: %${item.quote.depositPercent}`, 108, y + 115);
      ctx.fillStyle = '#E05319';
      ctx.font = 'bold 28px monospace';
      ctx.fillText(`Gerçekçi Toplam: ${item.realisticLow.toLocaleString('tr-TR')} – ${item.realisticHigh.toLocaleString('tr-TR')} ₺`, 108, y + 170);
      ctx.fillStyle = '#475569';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(item.redFlags[0] || 'Kritik kapsam ve ödeme dengesi olumlu.', 108, y + 225);
    });

    ctx.fillStyle = '#94A3B8';
    ctx.font = '22px monospace';
    ctx.fillText('zachariatrying.github.io/ustakontrol · %100 Cihaz İçi', 72, 1265);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `ustakontrol-teklif-${Date.now()}.png`;
    a.click();
    showToast('1080×1350 Teklif Karşılaştırma PNG indirildi!');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ustakontrol-yedek.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(String(r.result));
        if (Array.isArray(p)) {
          setQuotes(p);
          setKvkkOpen(false);
          showToast('Teklifler içe aktarıldı.');
        }
      } catch {}
    };
    r.readAsText(file);
  };

  const wipeAll = () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    setQuotes(DEMO_QUOTES);
    localStorage.removeItem(STORAGE_KEY);
    setDeleteStep(0);
    setKvkkOpen(false);
    showToast('Kayıtlar sıfırlandı.');
  };

  return (
    <div className="min-h-screen text-[#0E3A5D] pb-20">
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0E3A5D] text-white px-4 py-2 text-xs font-bold font-bp-mono border border-white">
          {toast}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Architectural Drawing Title Block Header (Zero Generic Top Bar!) */}
        <header className="border-2 border-[#0E3A5D] bg-white/95 grid grid-cols-1 md:grid-cols-12 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#0E3A5D]">
          <div className="md:col-span-5 p-4 flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}store-assets/ustakontrol_icon.png`}
              alt="UstaKontrol"
              className="w-11 h-11 border border-[#0E3A5D] object-cover shrink-0"
            />
            <div>
              <h1 className="font-bp-display text-2xl font-bold leading-none">UstaKontrol</h1>
              <p className="font-bp-mono text-[11px] text-[#475569] mt-1">
                PAFTA-01 // 13 KALEM TADİLAT DENETİMİ
              </p>
            </div>
          </div>

          <div className="md:col-span-4 p-4 flex flex-col justify-center">
            <div className="font-bp-mono text-[10px] text-[#475569]">ÖNERİLEN İLK PAZARLIK</div>
            <div className="font-bold text-sm text-[#0E3A5D] flex items-center gap-1.5 mt-0.5">
              <Award className="w-4 h-4 text-[#E05319]" />
              {bestQuote.quote.label} · {bestQuote.quote.contractorName} ({bestQuote.score}/100)
            </div>
          </div>

          <div className="md:col-span-3 p-4 flex items-center justify-between gap-2">
            <div>
              <label className="font-bp-mono text-[10px] text-[#475569] block">HEDEF BÜTÇE (₺)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value) || 0)}
                className="w-24 border-b-2 border-[#0E3A5D] font-bp-mono text-sm font-bold bg-transparent focus:outline-none"
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={downloadSummaryPng}
                className="bg-[#E05319] text-white px-2.5 py-2 text-xs font-bold font-bp-mono cursor-pointer"
                title="Özet PNG"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setDeleteStep(0);
                  setKvkkOpen(true);
                }}
                className="border border-[#0E3A5D] p-2 text-[#0E3A5D] hover:bg-[#0E3A5D] hover:text-white cursor-pointer"
                title="KVKK & Veri Kontrolü"
              >
                <Shield className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Visual Stacked Cost Bars: Written Quote vs Hatched Hidden Extras */}
        <section className="border-2 border-[#0E3A5D] bg-white/95 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bp-display text-sm font-bold uppercase tracking-wide">
              Yazılı Teklif vs. Gizli Ekstra Maliyet Analizi
            </h2>
            <div className="flex items-center gap-4 font-bp-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#0E3A5D] inline-block" /> Yazılı Teklif
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 hatched-extras inline-block border border-[#0E3A5D]" /> Olası Ekstralar
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {audited.map((item) => {
              const basePct = Math.round((item.quote.quotedTotal / maxRealistic) * 100);
              const extraPct = Math.round(((item.extrasHigh) / maxRealistic) * 100);
              return (
                <div key={item.quote.id} className="space-y-1">
                  <div className="flex justify-between font-bp-mono text-xs">
                    <span className="font-bold">
                      {item.quote.label} ({item.quote.contractorName})
                    </span>
                    <span>
                      {item.quote.quotedTotal.toLocaleString('tr-TR')} ₺ →{' '}
                      <strong className="text-[#E05319]">{item.realisticHigh.toLocaleString('tr-TR')} ₺</strong>
                    </span>
                  </div>
                  <div className="h-5 w-full bg-[#F1F5F9] border border-[#0E3A5D]/40 flex overflow-hidden">
                    <div className="h-full bg-[#0E3A5D]" style={{ width: `${basePct}%` }} />
                    <div className="h-full hatched-extras border-l border-white" style={{ width: `${extraPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sheet Tabs */}
        <nav className="grid grid-cols-3 border-2 border-[#0E3A5D] bg-white divide-x-2 divide-[#0E3A5D]">
          {[
            { id: 'compare', label: 'P-01 Teklifler', icon: Scale },
            { id: 'matrix', label: 'P-02 13 Kalem Matrisi', icon: Hammer },
            { id: 'contract', label: 'P-03 Sözleşme & Sorular', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`py-2.5 px-2 text-xs sm:text-sm font-bold font-bp-mono flex items-center justify-center gap-1.5 cursor-pointer ${
                  active ? 'bg-[#0E3A5D] text-white' : 'text-[#0E3A5D] hover:bg-[#E2E8F0]/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {tab === 'compare' && (
          <div className="grid md:grid-cols-3 gap-4">
            {audited.map((item, idx) => {
              const q = item.quote;
              const overBudget = item.realisticLow > budget;
              return (
                <div
                  key={q.id}
                  className={`bg-white/95 p-4 border-2 space-y-3 ${
                    idx === 0 ? 'border-[#E05319]' : 'border-[#0E3A5D]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bp-mono text-xs">
                    <span className="font-bold px-2 py-0.5 bg-[#0E3A5D] text-white">{q.label}</span>
                    <span className="font-bold">{item.score}/100 PUAN</span>
                  </div>

                  <input
                    type="text"
                    value={q.contractorName}
                    onChange={(e) => updateQuoteField(q.id, 'contractorName', e.target.value)}
                    className="w-full font-bp-display font-bold text-base border-b border-[#0E3A5D]/30 pb-1 bg-transparent focus:outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs font-bp-mono">
                    <div>
                      <label className="text-[10px] text-[#475569]">YAZILI TEKLİF (₺)</label>
                      <input
                        type="number"
                        value={q.quotedTotal}
                        onChange={(e) => updateQuoteField(q.id, 'quotedTotal', Number(e.target.value) || 0)}
                        className="w-full mt-0.5 border border-[#0E3A5D]/40 px-2 py-1 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#475569]">PEŞİNAT (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={q.depositPercent}
                        onChange={(e) => updateQuoteField(q.id, 'depositPercent', Number(e.target.value) || 0)}
                        className="w-full mt-0.5 border border-[#0E3A5D]/40 px-2 py-1 font-bold"
                      />
                    </div>
                  </div>

                  <div className="border border-[#0E3A5D]/30 bg-[#F4F7FA] p-3 space-y-1 font-bp-mono text-xs">
                    <div className="flex justify-between">
                      <span>Olası Ekstralar:</span>
                      <span className="font-bold text-[#E05319]">
                        +{item.extrasLow.toLocaleString('tr-TR')}–{item.extrasHigh.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#0E3A5D]/20 font-bold">
                      <span>Gerçekçi Toplam:</span>
                      <span className={overBudget ? 'text-rose-700' : 'text-emerald-800'}>
                        {item.realisticLow.toLocaleString('tr-TR')}–{item.realisticHigh.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  </div>

                  {item.redFlags.length > 0 && (
                    <div className="space-y-1.5">
                      {item.redFlags.map((rf, rIdx) => (
                        <div key={rIdx} className="text-[11px] bg-rose-50 border border-rose-300 text-rose-900 px-2.5 py-1.5">
                          {rf}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'matrix' && (
          <div className="border-2 border-[#0E3A5D] bg-white p-4 overflow-x-auto">
            <h2 className="font-bp-display text-sm font-bold mb-3">
              13 Kalem Şartname Çizelgesi (Hücreye dokunarak durumu değiştir)
            </h2>
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-b-2 border-[#0E3A5D] text-left font-bp-mono">
                  <th className="py-2 pr-3">KAPSAM KALEMİ</th>
                  {quotes.map((q) => (
                    <th key={q.id} className="py-2 px-2 text-center">{q.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RENOVATION_SCOPES.map((sc) => (
                  <tr key={sc.id} className="border-b border-[#0E3A5D]/15">
                    <td className="py-2.5 pr-3">
                      <div className="font-bold">{sc.label}</div>
                      <div className="text-[11px] text-[#475569]">{sc.whyImportant}</div>
                    </td>
                    {quotes.map((q) => {
                      const st = q.scopes[sc.id] || 'unclear';
                      const cls =
                        st === 'included'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-700'
                          : st === 'excluded'
                          ? 'bg-rose-100 text-rose-900 border-rose-700'
                          : st === 'unclear'
                          ? 'bg-amber-100 text-amber-900 border-amber-700'
                          : 'bg-sky-100 text-sky-900 border-sky-700';
                      return (
                        <td key={q.id} className="py-2 px-2 text-center">
                          <button
                            onClick={() => cycleScopeStatus(q.id, sc.id)}
                            className={`px-2.5 py-1 border font-bp-mono font-bold text-[11px] cursor-pointer ${cls}`}
                          >
                            {STATUS_LABELS[st]}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'contract' && (
          <div className="space-y-4">
            <div className="border-2 border-[#0E3A5D] bg-white p-5 space-y-2.5">
              <h3 className="font-bp-display text-sm font-bold">Sözleşmeye Yazılması Gereken 5 Madde</h3>
              {MUST_HAVE_CONTRACT_ITEMS.map((item, i) => (
                <div key={i} className="text-xs sm:text-sm bg-[#F4F7FA] px-3.5 py-2.5 border border-[#0E3A5D]/30">
                  {item}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {audited.map((item) => (
                <div key={item.quote.id} className="border-2 border-[#0E3A5D] bg-white p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold">{item.quote.contractorName}</h4>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(item.questions.join('\n'));
                        setCopiedIdx(item.quote.id);
                        setTimeout(() => setCopiedIdx(null), 1500);
                      }}
                      className="text-xs font-bold font-bp-mono text-[#E05319] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIdx === item.quote.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedIdx === item.quote.id ? 'TAMAM' : 'KOPYALA'}
                    </button>
                  </div>
                  <ul className="text-xs text-[#334155] space-y-1.5 list-disc pl-4">
                    {item.questions.slice(0, 6).map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="border-t-2 border-[#0E3A5D]/30 pt-4 text-xs text-[#475569] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E05319] shrink-0 mt-0.5" />
            <p>
              UstaKontrol maliyet aralıkları bilgilendirme amaçlıdır; mühendislik keşfi, yapı denetim veya hukuk
              danışmanlığı yerine geçmez.
            </p>
          </div>
          <a href="./privacy.html" className="underline font-bold text-[#0E3A5D]">
            Gizlilik &amp; KVKK
          </a>
        </footer>
      </main>

      {kvkkOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
          <div className="border-2 border-[#0E3A5D] bg-white max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#0E3A5D]/20 pb-2">
              <h3 className="font-bp-display text-base font-bold">KVKK &amp; Veri Kontrolü</h3>
              <button onClick={() => setKvkkOpen(false)} className="p-1 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <button onClick={exportJson} className="w-full py-2.5 px-4 border border-[#0E3A5D] bg-[#F4F7FA] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
                <Download className="w-4 h-4" /> Teklifleri JSON İndir
              </button>
              <label className="w-full py-2.5 px-4 border border-[#0E3A5D] bg-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> JSON Yedeğinden Geri Yükle
                <input type="file" accept="application/json" className="hidden" onChange={importJson} />
              </label>
              <button
                onClick={wipeAll}
                className={`w-full py-2.5 px-4 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                  deleteStep === 1 ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-400'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {deleteStep === 1 ? 'Emin misin? Varsayılana Sıfırla' : 'Tüm Verilerimi Kalıcı Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
