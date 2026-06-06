import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductWithBankData } from "@/lib/data/banks"; 
import type { ResidencyStatus, LegalType, KYCRule } from "@/types/bank";

export const dynamic = 'force-dynamic'; 

function formatResidencyStatus(status: ResidencyStatus): string {
  const mapping: Record<ResidencyStatus, string> = {
    non_resident: "Нерезидент (Турист / Белый картон)",
    resident_less_1y: "ВНЖ (до 1 года)",
    resident_more_1y: "Валютный резидент (ВНЖ более 1 года)",
    permanent_resident: "ПМЖ (Stalno nastanjenje)",
    citizen: "Гражданин Сербии / Гражданство"
  };
  return mapping[status] || status;
}

// Изменена типизация params для поддержки Next.js 15 (Promise)
export default async function ProductPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  
  // 🔥 ИСПРАВЛЕНИЕ 404: Безопасно разворачиваем params и декодируем URL
  const resolvedParams = await Promise.resolve(params);
  const productId = decodeURIComponent(resolvedParams.id);
  
  const cookieStore = await cookies();
  const userStatus = (cookieStore.get("expat_status")?.value || "non_resident") as ResidencyStatus;
  const userLegalType = (cookieStore.get("expat_legal_type")?.value || "individual") as LegalType;

  // Ищем продукт по корректному ID
  const data = await getProductWithBankData(productId);
  
  if (!data) {
    notFound();
  }

  const { bank, product } = data;

  const currentKycRule = bank.kyc_matrix?.find(
    (rule: KYCRule) => rule.status === userStatus && rule.legal_type === userLegalType
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-sans antialiased animate-fade-in">
      
      {/* Кнопка возврата */}
      <Link href="/accounts" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 group">
        <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Назад к матрице счетов
      </Link>

      {/* Заголовок */}
      <header className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{product.name}</h1>
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
            {bank.brand_name}
          </span>
        </div>
        <p className="text-slate-500 text-sm">
          Тип продукта: {product.category === 'business_account' ? 'Бизнес-аккаунт (ИП / Юрлицо)' : 'Личный текущий счет'}
        </p>
      </header>

      {/* Профиль пользователя */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex flex-wrap justify-between items-center gap-4 text-xs text-slate-600">
        <div>
          Условия комплаенса и лимиты отображаются под профиль:
          <div className="mt-1 font-semibold text-slate-900">
            {formatResidencyStatus(userStatus)} • {userLegalType === 'business' ? 'Предприниматель (ИП)' : 'Физическое лицо'}
          </div>
        </div>
      </div>

      {/* Информер блокировки */}
      {currentKycRule && !currentKycRule.is_available && (
        <div className="p-4 mb-8 bg-red-50 border border-red-200 text-red-900 rounded-xl flex gap-3">
          <svg className="w-5 h-5 shrink-0 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-bold text-red-950">Счет недоступен для данного статуса</h4>
            <p className="text-sm text-red-800 mt-1">
              По логам экспат-чатов, банк {bank.brand_name} отказывает в открытии этого типа аккаунта заявителям с вашим статусом резидентства.
            </p>
            {(currentKycRule.red_flags?.length || 0) > 0 && (
              <div className="mt-2 text-xs font-semibold bg-white/60 p-2 rounded border border-red-100">
                Причина: {currentKycRule.red_flags[0]}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Метрики и фичи */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Финансы */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Тарифная сетка продукта</h3>
          </div>
          <div className="p-5 space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">Обслуживание (RSD)</span>
              <span className="font-bold text-slate-900">
                {product.maintenance_fee_rsd !== undefined ? `${product.maintenance_fee_rsd} RSD / мес` : "Нет данных"}
              </span>
            </div>
            
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">Входящий SWIFT</span>
              <span className="font-bold text-slate-900 text-right">
                {product.swift_in?.pct !== undefined ? `${product.swift_in.pct}%` : "Нет данных"}
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  {product.swift_in?.min_rsd ? `Мин ${product.swift_in.min_rsd} RSD` : "Без комиссии банка"}
                </span>
              </span>
            </div>
            
            <div className="flex justify-between pb-2">
              <span className="text-slate-500">Исходящий SWIFT</span>
              <span className="font-bold text-slate-900 text-right">
                {product.swift_out?.pct !== undefined ? `${product.swift_out.pct}%` : "Нет данных"}
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  {product.swift_out?.min_rsd ? `Мин ${product.swift_out.min_rsd} RSD` : ""}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Локальные фичи */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Специфика платежных систем</h3>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Мультивалютность ({product.supported_currencies?.join(', ') || 'RSD'})</span>
              <span className={product.is_multicurrency ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                {product.is_multicurrency ? 'Да' : 'Нет'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Apple Pay поддержка</span>
              <span className={product.features?.apple_pay ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                {product.features?.apple_pay ? 'Есть' : 'Нет'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Сервис Prenesi (перевод по номеру)</span>
              <span className={product.features?.prenesi ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                {product.features?.prenesi ? 'Доступен' : 'Нет'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">IPS QR-платежи (Народный Банк)</span>
              <span className={product.features?.ips_qr ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                {product.features?.ips_qr ? 'Работают' : 'Нет'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Папка документов KYC */}
      {currentKycRule && currentKycRule.is_available && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8 shadow-xs">
          <div className="px-5 py-4 bg-slate-900 text-white">
            <h3 className="font-bold text-base">Список документов для подачи в комплаенс</h3>
          </div>
          <div className="p-5">
            <ul className="space-y-2.5 mb-6 text-sm">
              {currentKycRule.required_docs?.map((doc: string, idx: number) => (
                <li key={idx} className="flex items-start">
                  <svg className="w-4 h-4 text-emerald-500 mr-2.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-slate-700">{doc}</span>
                </li>
              ))}
            </ul>

            {(currentKycRule.red_flags?.length || 0) > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-xs text-amber-900">
                <span className="font-bold block mb-1">Специфика сербского рандома в {bank.brand_name}:</span>
                <ul className="list-disc pl-4 space-y-1 text-amber-800">
                  {currentKycRule.red_flags.map((flag: string, idx: number) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ограничения DinaCard */}
      <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600 mb-8 border border-slate-200">
        <span className="font-bold text-slate-800 block mb-1">Обязательное примечание по DinaCard:</span>
        {product.cards?.dina_notes || "Согласно регулированию NBS, карта DinaCard выпускается автоматически ко всем счетам в RSD. Она работает только на территории Сербии."}
      </div>

    </div>
  );
}