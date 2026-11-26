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

  const updateQuoteField = <K extends keyof ContractorQuote>(
    id: string,
    key: K,
    value: ContractorQuote[K]
  ) => {
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

    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(0, 0, 1080, 18);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('USTAKONTROL · TADİLAT TEKLİF KARŞILAŞTIRMASI', 72, 100);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText(`Hedef Bütçe: ${budget.toLocaleString('tr-TR')} ₺`, 72, 185);

    audited.slice(0, 3).forEach((item, idx) => {
      const y = 250 + idx * 310;
      ctx.fillStyle = idx === 0 ? '#F0FDF4' : '#FFFFFF';
      ctx.fillRect(72, y, 936, 275);
      ctx.fillStyle = idx === 0 ? '#047857' : '#1E3A5F';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillText(
        `${item.quote.label} · ${item.quote.contractorName} (Skor: ${item.score}/100)`,
        108,
        y + 60
      );
      ctx.fillStyle = '#334155';
      ctx.font = '26px system-ui, sans-serif';
      ctx.fillText(
        `Yazılı Teklif: ${item.quote.quotedTotal.toLocaleString('tr-TR')} ₺  |  Peşinat: %${item.quote.depositPercent}`,
        108,
        y + 115
      );
      ctx.fillStyle = '#C2410C';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(
        `Gerçekçi Toplam: ${item.realisticLow.toLocaleString('tr-TR')} – ${item.realisticHigh.toLocaleString('tr-TR')} ₺`,
        108,
        y + 170
      );
      ctx.fillStyle = '#64748B';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(
        item.redFlags[0] || 'Kritik kapsam ve ödeme dengesi olumlu.',
        108,
        y + 225
      );
    });

    ctx.fillStyle = '#94A3B8';
    ctx.font = '24px system-ui, sans-serif';
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
      } catch {
        showToast('Geçersiz JSON.');
      }
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-24">
      <header className="sticky top-0 z-30 bg-[#1E3A5F] text-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="./store-assets/ustakontrol_icon.png"
              alt="UstaKontrol"
              className="w-10 h-10 rounded-xl border border-white/20"
            />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight leading-tight">UstaKontrol</h1>
              <p className="text-xs text-slate-300">13 Kalemde Tadilat Teklif Denetçisi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadSummaryPng}
              className="px-3 py-1.5 rounded-lg bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-orange-600 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Özet PNG
            </button>
            <button
              onClick={() => {
                setDeleteStep(0);
                setKvkkOpen(true);
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer"
              title="KVKK & Veri Kontrolü"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* Recommendation & Budget Bar */}
        <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase">İlk Pazarlık Önerisi</div>
              <div className="text-base font-extrabold text-slate-900">
                {bestQuote.quote.label} — {bestQuote.quote.contractorName} ({bestQuote.score}/100)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Hedef Bütçen (₺):</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
              className="w-32 border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-bold"
            />
          </div>
        </section>

        {/* Tabs */}
        <nav className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1 rounded-xl">
          {[
            { id: 'compare', label: 'Teklif Analizi', icon: Scale },
            { id: 'matrix', label: '13 Kalem Matrisi', icon: Hammer },
            { id: 'contract', label: 'Sorular & Sözleşme', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  active ? 'bg-white text-[#1E3A5F] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* TAB 1: COMPARE */}
        {tab === 'compare' && (
          <div className="grid md:grid-cols-3 gap-4">
            {audited.map((item, idx) => {
              const q = item.quote;
              const overBudget = item.realisticLow > budget;
              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl p-4 border-2 shadow-xs space-y-3 ${
                    idx === 0 ? 'border-emerald-500' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                      {q.label}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                        item.score >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.score >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Skor: {item.score}/100
                    </span>
                  </div>

                  <input
                    type="text"
                    value={q.contractorName}
                    onChange={(e) => updateQuoteField(q.id, 'contractorName', e.target.value)}
                    className="w-full font-extrabold text-base border-b border-slate-200 pb-1 focus:outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-slate-500 font-semibold">Yazılı Teklif (₺)</label>
                      <input
                        type="number"
                        value={q.quotedTotal}
                        onChange={(e) =>
                          updateQuoteField(q.id, 'quotedTotal', Number(e.target.value) || 0)
                        }
                        className="w-full mt-0.5 border border-slate-300 rounded-lg px-2 py-1 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-semibold">Peşinat (%)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={q.depositPercent}
                        onChange={(e) =>
                          updateQuoteField(q.id, 'depositPercent', Number(e.target.value) || 0)
                        }
                        className="w-full mt-0.5 border border-slate-300 rounded-lg px-2 py-1 font-bold"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Olası Ekstralar:</span>
                      <span className="font-bold text-orange-700">
                        +{item.extrasLow.toLocaleString('tr-TR')} – {item.extrasHigh.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                      <span className="font-bold">Gerçekçi Toplam:</span>
                      <span className={`font-extrabold ${overBudget ? 'text-rose-700' : 'text-emerald-800'}`}>
                        {item.realisticLow.toLocaleString('tr-TR')} – {item.realisticHigh.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  </div>

                  {item.redFlags.length > 0 && (
                    <div className="space-y-1.5">
                      {item.redFlags.map((rf, rIdx) => (
                        <div
                          key={rIdx}
                          className="text-[11px] bg-rose-50 border border-rose-200 text-rose-900 rounded-lg px-2.5 py-1.5"
                        >
                          ⚠ {rf}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: 13-SCOPE MATRIX */}
        {tab === 'matrix' && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold">
                13 Standart Tadilat Kalemi (Durumu değiştirmek için hücreye dokun)
              </h2>
            </div>
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-3">Kapsam Kalemi</th>
                  {quotes.map((q) => (
                    <th key={q.id} className="py-2 px-2 text-center">
                      {q.label} ({q.contractorName.split(' ')[0]})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RENOVATION_SCOPES.map((sc) => (
                  <tr key={sc.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-3">
                      <div className="font-bold text-slate-900">{sc.label}</div>
                      <div className="text-[11px] text-slate-500">{sc.whyImportant}</div>
                    </td>
                    {quotes.map((q) => {
                      const st = q.scopes[sc.id] || 'unclear';
                      const cls =
                        st === 'included'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : st === 'excluded'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : st === 'unclear'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-sky-100 text-sky-900 border-sky-300';
                      return (
                        <td key={q.id} className="py-2 px-2 text-center">
                          <button
                            onClick={() => cycleScopeStatus(q.id, sc.id)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold border text-[11px] cursor-pointer ${cls}`}
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

        {/* TAB 3: QUESTIONS & CONTRACT */}
        {tab === 'contract' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <h3 className="text-sm font-extrabold">Olmazsa Olmaz 5 Sözleşme &amp; Hak Ediş Maddesi</h3>
              {MUST_HAVE_CONTRACT_ITEMS.map((item, i) => (
                <div key={i} className="text-xs sm:text-sm bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                  {item}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {audited.map((item) => (
                <div key={item.quote.id} className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold">{item.quote.contractorName}</h4>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(item.questions.join('\n'));
                        setCopiedIdx(item.quote.id);
                        setTimeout(() => setCopiedIdx(null), 1500);
                      }}
                      className="text-xs font-bold text-[#1E3A5F] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedIdx === item.quote.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedIdx === item.quote.id ? 'Kopyalandı' : 'Soruları Kopyala'}
                    </button>
                  </div>
                  {item.questions.length === 0 ? (
                    <p className="text-xs text-emerald-700">Tüm temel kalemler net görünüyor.</p>
                  ) : (
                    <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                      {item.questions.slice(0, 6).map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="bg-white/80 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Bilgilendirme:</strong> UstaKontrol tahmini maliyet aralıkları bilgilendirme amaçlıdır; mühendislik keşfi veya resmî hukuki sözleşme danışmanlığı yerine geçmez.
          </p>
        </footer>
      </main>

      {kvkkOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#1E3A5F]" /> KVKK &amp; Veri Kontrolü
              </h3>
              <button onClick={() => setKvkkOpen(false)} className="p-1 text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Hesap açmadan tam kullanım sunulur. Teklifleriniz yalnızca kendi cihazınızda saklanır.
            </p>
            <div className="space-y-2">
              <button
                onClick={exportJson}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 border cursor-pointer"
              >
                <Download className="w-4 h-4" /> Teklifleri JSON İndir
              </button>
              <label className="w-full py-2.5 px-4 rounded-xl bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border cursor-pointer">
                <Upload className="w-4 h-4" /> JSON Yedeğinden Geri Yükle
                <input type="file" accept="application/json" className="hidden" onChange={importJson} />
              </label>
              <button
                onClick={wipeAll}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                  deleteStep === 1 ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
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
