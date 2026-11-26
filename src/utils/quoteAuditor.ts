import { ContractorQuote, RENOVATION_SCOPES } from '../data/renovationScopes';

export interface AuditedQuote {
  quote: ContractorQuote;
  extrasLow: number;
  extrasHigh: number;
  realisticLow: number;
  realisticHigh: number;
  redFlags: string[];
  questions: string[];
  score: number;
}

export function auditContractorQuotes(quotes: ContractorQuote[]): AuditedQuote[] {
  return quotes
    .map((q) => {
      let extrasLow = 0;
      let extrasHigh = 0;
      const redFlags: string[] = [];
      const questions: string[] = [];

      if (q.depositPercent > 30) {
        redFlags.push(`%${q.depositPercent} peşinat talebi yüksek finansal risk taşır (önerilen tavan %25–%30).`);
      }
      if (!q.vatIncluded) {
        redFlags.push('KDV hariç teklif: Fatura istenirse +%20 maliyet artışı doğabilir.');
      }
      if (q.warrantyMonths < 12) {
        redFlags.push('Yazılı işçilik / su sızdırmazlık garantisi belirtilmemiş.');
      }

      let coveredCount = 0;
      for (const scope of RENOVATION_SCOPES) {
        const st = q.scopes[scope.id] || 'unclear';
        if (st === 'included') {
          coveredCount++;
        } else if (st === 'excluded' || st === 'unclear') {
          extrasLow += scope.extraLow;
          extrasHigh += scope.extraHigh;
          if (scope.critical && st === 'excluded') {
            redFlags.push(`Kritik kalem hariç bırakılmış: ${scope.label}`);
          }
          questions.push(
            `${scope.label} teklife dahil mi? Hariçse tahmini tutarı sözleşmeye net yazabilir misiniz?`
          );
        }
      }

      const completenessScore = Math.round((coveredCount / RENOVATION_SCOPES.length) * 45);
      const paymentScore = q.depositPercent <= 25 ? 25 : q.depositPercent <= 35 ? 15 : 5;
      const warrantyScore = q.warrantyMonths >= 24 ? 20 : q.warrantyMonths >= 12 ? 12 : 2;
      const clarityScore = Math.max(0, 10 - questions.length);
      const score = Math.min(100, completenessScore + paymentScore + warrantyScore + clarityScore);

      return {
        quote: q,
        extrasLow,
        extrasHigh,
        realisticLow: q.quotedTotal + extrasLow,
        realisticHigh: q.quotedTotal + extrasHigh,
        redFlags,
        questions,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export const MUST_HAVE_CONTRACT_ITEMS = [
  'Ödeme Planı: %20 iş başlangıcı (malzeme sahaya inince), %30 tesisat + su yalıtımı testi sonrası, %35 seramik/boya bitince, %15 eksiksiz teslimde.',
  'Su Yalıtımı Şartı: Çift kat sürme izolasyon + köşe pah bandı uygulanıp fotoğraf/su göleti testiyle onaylanacak.',
  'Marka/Seri Netliği: Kullanılacak seramik yapıştırıcı, PPRC boru ve vitrifiye markaları marka/model olarak yazılacak.',
  'Ek İş Protokolü: Yazılı onay alınmayan hiçbir "ekstra iş" için sonradan ücret talep edilmeyecek.',
  'Teslim Tarihi & İşçilik Garantisi: Gecikme şartı ve en az 24 ay tesisat/izolasyon işçilik garantisi eklenecek.',
];
