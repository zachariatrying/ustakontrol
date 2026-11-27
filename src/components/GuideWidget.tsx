import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, ClipboardCheck, Hammer, MessageSquare, X } from 'lucide-react';

const GUIDE_STEPS = [
  {
    icon: Hammer,
    badge: '01 · TEKLİFLERİ GİR & KIYASLA',
    title: 'Usta Tekliflerini Yan Yana Koy',
    desc: 'Banyo, mutfak, boya veya komple tadilat için ustalardan aldığınız kalemleri ve toplam tutarı girin; m² ve kalem bazlı kıyaslama yapın.',
  },
  {
    icon: ClipboardCheck,
    badge: '02 · KAPSAM BOŞLUĞU DENETİMİ',
    title: 'Unutulan Gizli Ekstraları Yakala',
    desc: '"Moloz atımı, su yalıtımı, tesisat basınç testi, elektrik buat yenileme" gibi teklifte yazılmayıp sonradan ekstra çıkarılan kalemleri otomatik görün.',
  },
  {
    icon: AlertTriangle,
    badge: '03 · ÖDEME TAKVİMİ RİSKİ',
    title: 'Hakediş Bazlı Güvenli Ödeme',
    desc: 'İş başlamadan yüksek peşinat isteyen tekliflerde uyarı alın; malzeme teslimi ve aşama bitimine bağlı güvenli ödeme planını inceleyin.',
  },
  {
    icon: MessageSquare,
    badge: '04 · USTAYA SORULACAK SORULAR',
    title: 'Tek Tıkla WhatsApp Kontrol Listesi',
    desc: 'Anlaşma öncesi ustaya yöneltmeniz gereken net teknik soruları kopyalayıp mesaj olarak gönderin.',
  },
];

export function GuideWidget() {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('rehber') === '1' || window.location.hash === '#rehber';
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="UstaKontrol kullanım rehberini aç"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 border-2 border-white bg-[#0E3A5D] hover:bg-[#092842] text-white px-4 py-2.5 text-xs font-bold font-bp-mono shadow-lg cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#E05319] focus-visible:ring-offset-2"
      >
        <BookOpen className="w-4 h-4 text-[#E05319]" />
        <span>Rehber</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-guide-title"
        >
          <div
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto border-2 border-[#0E3A5D] bg-white text-[#0E3A5D] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-[#0E3A5D] bg-[#0E3A5D] text-white px-5 py-4">
              <div>
                <div className="font-bp-mono text-[10px] font-bold uppercase tracking-wider text-[#FDBA74]">
                  UstaKontrol Keşif &amp; Denetim Rehberi
                </div>
                <h2 id="app-guide-title" className="font-bp-display text-lg font-bold">
                  Tadilat Teklifi Nasıl Denetlenir?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Rehberi kapat"
                className="border border-white/40 p-1.5 hover:bg-white/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#E05319]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 bg-[#F4F7FA]">
              {GUIDE_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.badge}
                    className="border border-[#0E3A5D]/25 bg-white p-3.5 flex items-start gap-3"
                  >
                    <div className="shrink-0 bg-[#FFF3ED] border border-[#E05319]/40 text-[#E05319] p-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-bp-mono text-[10px] font-bold text-[#E05319]">
                        {step.badge}
                      </div>
                      <h3 className="font-bp-display text-sm font-bold">{step.title}</h3>
                      <p className="text-xs text-[#0E3A5D]/80 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}

              <div className="border border-[#0E3A5D]/25 bg-white px-3.5 py-2.5 text-[11px] font-bp-mono">
                Not: Maliyet aralıkları bilgilendirme amaçlıdır; mühendislik keşfi veya yapı denetimi yerine geçmez.
              </div>
            </div>

            <div className="border-t border-[#0E3A5D]/20 px-5 py-3 flex justify-end bg-white">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-[#0E3A5D] hover:bg-[#092842] text-white px-4 py-2 text-xs font-bold font-bp-mono cursor-pointer focus-visible:ring-2 focus-visible:ring-[#E05319]"
              >
                ANLADIM
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
