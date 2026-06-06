// src/lib/data/banks.ts
import fs from 'fs';
import path from 'path';
import type { BankJSON, BankProduct, ResidencyStatus, LegalType, TransformedMatrixItem } from '@/types/bank';

const banksDirectory = path.join(process.cwd(), 'data/banks');
let banksCache: BankJSON[] | null = null;

export async function getAllBanks(): Promise<BankJSON[]> {
  if (banksCache) return banksCache;
  if (!fs.existsSync(banksDirectory)) return [];

  const fileNames = fs.readdirSync(banksDirectory);
  const banks = fileNames
    .filter(fileName => fileName.endsWith('.json'))
    .map(fileName => {
      const fullPath = path.join(banksDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      try {
        if (!fileContents.trim()) return null;
        return JSON.parse(fileContents) as BankJSON;
      } catch (error) {
        console.error(`🚨 Ошибка JSON в ${fileName}:`, error);
        return null;
      }
    })
    .filter((bank): bank is BankJSON => bank !== null);

  banksCache = banks;
  return banks;
}

export async function getProductWithBankData(productId: string): Promise<{ bank: BankJSON; product: BankProduct } | null> {
  const banks = await getAllBanks();
  for (const bank of banks) {
    const product = bank.products.find(p => p.product_id === productId);
    if (product) return { bank, product };
  }
  return null;
}

// Категории, которые относятся к счетам — фильтруются по legalType
const ACCOUNT_CATEGORIES = ['personal_account', 'business_account'] as const;

export async function getMatrixItemsForStatus(
  status: ResidencyStatus, 
  legalType: LegalType
): Promise<TransformedMatrixItem[]> {
  const banks = await getAllBanks();
  const items: TransformedMatrixItem[] = [];

  for (const bank of banks) {
    // Ищем точечное правило под выбранные куки
    let kycRule = bank.kyc_matrix?.find(
      rule => rule.status === status && rule.legal_type === legalType
    );
    
    // 🔥 ГРАМОТНЫЙ ПЕРЕХВАТ: Если комбинации нет в JSON (например, Нерезидент + ИП)
    if (!kycRule) {
      if (status === 'citizen' || status === 'permanent_resident') {
        // Заглушка для ПМЖ/Граждан — им доступно всё
        kycRule = {
          status,
          legal_type: legalType,
          is_available: true,
          probability: 'high',
          required_docs: legalType === 'business' ? ['Лична карта (ID)', 'Rešenje APR'] : ['Лична карта (ID)'],
          red_flags: []
        };
      } else {
        // Для Туристов и ВНЖ — не скрываем банк, а выводим карточку с явным отказом комплаенса!
        kycRule = {
          status,
          legal_type: legalType,
          is_available: false,
          probability: 'blocked',
          required_docs: [],
          red_flags: [
            legalType === 'business'
              ? `Комплаенс ${bank.brand_name} полностью блокирует открытие счетов для ИП/ООО лицам со статусом нерезидента или первичного ВНЖ без сербских контрактов.`
              : `Открытие личных девизных счетов для физлиц в ${bank.brand_name} временно ограничено под данный тип боравака.`
          ]
        };
      }
    }

    // Распределяем продукты по категориям
    for (const product of bank.products) {
      const isAccountProduct = (ACCOUNT_CATEGORIES as readonly string[]).includes(product.category);

      if (isAccountProduct) {
        // Счета: фильтруем по legalType как раньше
        const isBusinessProduct = product.category === 'business_account';
        const isBusinessUser = legalType === 'business';
        if (isBusinessProduct !== isBusinessUser) continue;
      }
      // Остальные категории (savings_deposit, investment_bonds, credit_*, transfer)
      // показываем всегда — они не зависят от legalType

      items.push({
        id: `${bank.bank_id}_${product.product_id}`,
        product_id: product.product_id,
        residency_status: status,
        is_available: kycRule.is_available,
        probability: kycRule.probability,
        kyc_requirements: kycRule.required_docs,
        red_flags: kycRule.red_flags,
        products: {
          ...product,
          banks: {
            name: bank.brand_name,
            official_site: bank.website
          }
        }
      });
    }
  }

  return items;
}