export type ScopeStatus = 'included' | 'excluded' | 'unclear' | 'owner';

export interface RenovationScopeItem {
  id: string;
  label: string;
  critical: boolean;
  extraLow: number;
  extraHigh: number;
  whyImportant: string;
}

export const RENOVATION_SCOPES: RenovationScopeItem[] = [
  { id: 'moloz', label: '1. Kırım, Söküm & Moloz Atımı', critical: true, extraLow: 5500, extraHigh: 11000, whyImportant: 'Çuvallama, apartmandan indirme ve belediye/hafriyat aracı dahil değilse kapıda sürpriz çıkar.' },
  { id: 'tesisat', label: '2. Sıhhi Tesisat & PPRC / Atık Su', critical: true, extraLow: 9000, extraHigh: 16000, whyImportant: 'Eski boru değişmeden yeni seramik döşemek ileride kırma gerektirir.' },
  { id: 'elektrik', label: '3. Elektrik & IP44 Kaçak Akım', critical: true, extraLow: 4500, extraHigh: 9000, whyImportant: 'Islak hacim aydınlatma, priz hattı ve kaçak akım rölesi hayati güvenlik kalemidir.' },
  { id: 'yalitim', label: '4. Su Yalıtımı (Sürme + Pah Bandı)', critical: true, extraLow: 6000, extraHigh: 12000, whyImportant: 'Çift kat sürme izolasyon ve köşe pah bandı yoksa alt kata su sızar.' },
  { id: 'duvar_sap', label: '5. Şap, Sıva & Yeşil Alçıpan', critical: false, extraLow: 4500, extraHigh: 8500, whyImportant: 'Eğim şapı ve neme dayanıklı plaka kullanılmazsa seramikte göllenme olur.' },
  { id: 'seramik', label: '6. Seramik İşçiliği & Flex Yapıştırıcı', critical: true, extraLow: 12000, extraHigh: 22000, whyImportant: 'Yapıştırıcı, derz dolgu ve antibakteriyel silikon işçiliğe dahil mi netleşmeli.' },
  { id: 'vitrifiye_malz', label: '7. Vitrifiye & Batarya Malzeme Temini', critical: false, extraLow: 18000, extraHigh: 35000, whyImportant: 'Marka ve seri belirtilmezse en ucuz yan sanayi ürün takılabilir.' },
  { id: 'montaj', label: '8. Duşakabin, Dolap & Vitrifiye Montajı', critical: false, extraLow: 5000, extraHigh: 10000, whyImportant: 'Gömme rezervuar, klozet, duşakabin ve banyo dolabı montajı sıkça hariç bırakılır.' },
  { id: 'havalandirma', label: '9. Havalandırma Fanı & Menfez', critical: false, extraLow: 1800, extraHigh: 3800, whyImportant: 'Buhar ve küf oluşumunu önlemek için sessiz fan ve geri tepme klapesi gerekir.' },
  { id: 'boya', label: '10. Tavan Küf Önleyici Boya & Pervaz', critical: false, extraLow: 3000, extraHigh: 6500, whyImportant: 'Tavan boyası ve kapı pervazı tamiri genelde son gün ekstra yazılır.' },
  { id: 'koruma', label: '11. Zemin/Asansör Koruma & Temizlik', critical: false, extraLow: 2000, extraHigh: 4500, whyImportant: 'Apartman asansörü ve ev içi parkelerin kartonla korunması gerekir.' },
  { id: 'izin', label: '12. Site / Belediye İzni & Çalışma Saati', critical: false, extraLow: 1000, extraHigh: 2500, whyImportant: 'Hafta sonu ve akşam gürültü cezalarından kaçınmak için uyulmalıdır.' },
  { id: 'garanti', label: '13. İş Takvimi & 2 Yıl İşçilik Garantisi', critical: true, extraLow: 0, extraHigh: 0, whyImportant: 'Yazılı teslim tarihi ve su kaçak garantisi olmayan iş büyük risk taşır.' },
];

export interface ContractorQuote {
  id: string;
  label: string;
  contractorName: string;
  quotedTotal: number;
  vatIncluded: boolean;
  depositPercent: number;
  durationDays: number;
  warrantyMonths: number;
  scopes: Record<string, ScopeStatus>;
  notes: string;
}

export const DEMO_QUOTES: ContractorQuote[] = [
  {
    id: 'quote-a',
    label: 'Teklif A',
    contractorName: 'Hızlı & Ucuz Ekip',
    quotedTotal: 68000,
    vatIncluded: false,
    depositPercent: 60,
    durationDays: 10,
    warrantyMonths: 0,
    notes: 'Moloz ve su yalıtımı hariç, %60 peşin istiyor.',
    scopes: {
      moloz: 'excluded',
      tesisat: 'included',
      elektrik: 'unclear',
      yalitim: 'excluded',
      duvar_sap: 'included',
      seramik: 'included',
      vitrifiye_malz: 'owner',
      montaj: 'unclear',
      havalandirma: 'excluded',
      boya: 'excluded',
      koruma: 'excluded',
      izin: 'owner',
      garanti: 'excluded',
    },
  },
  {
    id: 'quote-b',
    label: 'Teklif B',
    contractorName: 'Titiz Yapı Dekorasyon',
    quotedTotal: 94000,
    vatIncluded: true,
    depositPercent: 25,
    durationDays: 14,
    warrantyMonths: 24,
    notes: 'Çift kat İzolasyon + moloz dahil, %25 başlangıç ve hak edişli ödeme.',
    scopes: {
      moloz: 'included',
      tesisat: 'included',
      elektrik: 'included',
      yalitim: 'included',
      duvar_sap: 'included',
      seramik: 'included',
      vitrifiye_malz: 'owner',
      montaj: 'included',
      havalandirma: 'included',
      boya: 'included',
      koruma: 'included',
      izin: 'included',
      garanti: 'included',
    },
  },
  {
    id: 'quote-c',
    label: 'Teklif C',
    contractorName: 'Anahtar Teslim Müteahhit',
    quotedTotal: 128000,
    vatIncluded: true,
    depositPercent: 35,
    durationDays: 18,
    warrantyMonths: 12,
    notes: 'Malzeme dahil yazıyor ama marka/seri belirtilmemiş.',
    scopes: {
      moloz: 'included',
      tesisat: 'included',
      elektrik: 'included',
      yalitim: 'unclear',
      duvar_sap: 'included',
      seramik: 'included',
      vitrifiye_malz: 'included',
      montaj: 'included',
      havalandirma: 'unclear',
      boya: 'included',
      koruma: 'unclear',
      izin: 'owner',
      garanti: 'included',
    },
  },
];
