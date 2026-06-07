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

const ACCOUNT_CATEGORIES = ['personal_account', 'business_account'] as const;

export async function getMatrixItemsForStatus(
  status: ResidencyStatus,
  legalType: LegalType
): Promise<TransformedMatrixItem[]> {
  const banks = await getAllBanks();
  const items: TransformedMatrixItem[] = [];

  for (const bank of banks) {
    let kycRule = bank.kyc_matrix?.find(
      rule => rule.status === status && rule.legal_type === legalType
    );

    if (!kycRule) {
      if (status === 'citizen' || status === 'permanent_resident') {
        kycRule = {
          status,
          legal_type: legalType,
          is_available: true,
          probability: 'high',
          required_docs: legalType === 'business' ? ['Лична карта (ID)', 'Rešenje APR'] : ['Лична карта (ID)'],
          red_flags: [],
          blocked_reasons: [],
        };
      } else {
        kycRule = {
          status,
          legal_type: legalType,
          is_available: false,
          probability: 'blocked',
          required_docs: [],
          red_flags: [
            legalType === 'business'
              ? `Комплаенс ${bank.brand_name} блокирует открытие счетов для ИП/ООО лицам без подтверждённого резидентства.`
              : `Открытие счетов для физлиц в ${bank.brand_name} ограничено для данного типа боравака.`,
          ],
          blocked_reasons: [],
        };
      }
    }

    for (const product of bank.products) {
      const isAccountProduct = (ACCOUNT_CATEGORIES as readonly string[]).includes(product.category);

      if (isAccountProduct) {
        const isBusinessProduct = product.category === 'business_account';
        const isBusinessUser = legalType === 'business';
        if (isBusinessProduct !== isBusinessUser) continue;
      }

      items.push({
        id: `${bank.bank_id}_${product.product_id}`,
        product_id: product.product_id,
        residency_status: status,
        is_available: kycRule.is_available,
        probability: kycRule.probability,
        kyc_requirements: kycRule.required_docs,
        red_flags: kycRule.red_flags,
        blocked_reasons: kycRule.blocked_reasons ?? [],
        products: {
          ...product,
          banks: {
            name: bank.brand_name,
            official_site: bank.website,
            logo_color: bank.logo_color ?? null,
          },
        },
      });
    }
  }

  return items;
}