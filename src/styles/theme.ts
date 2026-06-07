// src/styles/theme.ts
//
// ExpatFinance Navigator — Design Tokens (TypeScript-документация)
//
// Этот файл — единая точка правды по дизайну.
// CSS-переменные живут в globals.css, но здесь они задокументированы
// и доступны для использования в inline-стилях (например, logo_color банков).
//
// ПРАВИЛО: не хардкодь цвета и размеры в компонентах.
// Используй Tailwind-классы (они берут значения из globals.css)
// или константы из этого файла для inline-стилей.

// ─── Бренд ───────────────────────────────────────────────────────────────────

export const brand = {
  50:  '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  400: '#4ade80',
  500: '#22c55e',   // ← главный акцент: кнопки, активные табы
  600: '#16a34a',   // ← hover
  700: '#15803d',
  900: '#14532d',
} as const;

// ─── Нейтральные поверхности ──────────────────────────────────────────────────

export const surface = {
  page:    '#f8fafc',   // фон страницы (bg-slate-50)
  card:    '#ffffff',   // карточки
  level2:  '#f1f5f9',   // вторичный фон (bg-slate-100)
  level3:  '#e2e8f0',   // третичный (bg-slate-200)
} as const;

// ─── Текст ────────────────────────────────────────────────────────────────────

export const text = {
  primary:   '#0f172a',   // slate-900
  secondary: '#475569',   // slate-600
  muted:     '#94a3b8',   // slate-400
  inverted:  '#ffffff',
} as const;

// ─── Бордеры ──────────────────────────────────────────────────────────────────

export const border = {
  default: '#e2e8f0',   // slate-200
  soft:    '#f1f5f9',   // slate-100 — разделители внутри карточек
  strong:  '#cbd5e1',   // slate-300 — hover
} as const;

// ─── Семантика ────────────────────────────────────────────────────────────────
// Используй для KYC-бейджей, инфобоксов, статусов

export const semantic = {
  success: {
    bg:     '#f0fdf4',
    text:   '#166534',
    border: '#bbf7d0',
  },
  warning: {
    bg:     '#fffbeb',
    text:   '#92400e',
    border: '#fde68a',
  },
  danger: {
    bg:     '#fef2f2',
    text:   '#991b1b',
    border: '#fecaca',
  },
  info: {
    bg:     '#eff6ff',
    text:   '#1e40af',
    border: '#bfdbfe',
  },
} as const;

// ─── Радиусы ──────────────────────────────────────────────────────────────────

export const radius = {
  sm:  '6px',
  md:  '10px',
  lg:  '14px',   // карточки
  xl:  '18px',
  '2xl': '24px',
} as const;

// ─── Логотипы банков ──────────────────────────────────────────────────────────
// Используются для inline-стилей логотипов в BankMatrix, ProductDrawer, page.tsx
// Не хардкодь в компонентах — берётся из bank.logo_color (JSON)
// Эти значения — fallback если logo_color в JSON не заполнен

export const bankColors: Record<string, { bg: string; text: string }> = {
  raiffeisen_rs:  { bg: '#FFCC00', text: '#1e293b' },
  alta_rs:        { bg: '#E31837', text: '#ffffff' },
  intesa_rs:      { bg: '#009A44', text: '#ffffff' },
  otp_rs:         { bg: '#00803C', text: '#ffffff' },
  postanska_rs:   { bg: '#F7A600', text: '#1e293b' },
};

// ─── KYC Probability → цвет бейджа ───────────────────────────────────────────
// Единая логика раскраски — не дублировать в каждом компоненте

export type Probability = 'high' | 'medium' | 'low' | 'blocked';

export function getProbabilityStyle(probability: Probability, isAvailable: boolean): {
  label: string;
  className: string;
} {
  if (!isAvailable || probability === 'blocked') {
    return {
      label: 'Не открывают',
      className: 'bg-red-50 text-red-700 border-red-200',
    };
  }
  if (probability === 'high') {
    return {
      label: 'Высокая вероятность',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  if (probability === 'medium') {
    return {
      label: 'Сербский рандом',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  return {
    label: 'Сложно открыть',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  };
}

// ─── Хелпер для логотипа банка ────────────────────────────────────────────────
// Вычисляет цвет текста поверх logo_color (чёрный для светлых фонов)

export function getLogoStyle(logoColor: string | null | undefined): {
  backgroundColor: string;
  color: string;
} {
  const bg = logoColor ?? '#1e293b';
  // Светлые фоны: жёлтый Raiffeisen, оранжевый Poštanska
  const lightBgs = ['#FFCC00', '#F7A600', '#FFD700', '#FFC000'];
  const isLight = lightBgs.some(c => c.toLowerCase() === bg.toLowerCase());
  return {
    backgroundColor: bg,
    color: isLight ? '#1e293b' : '#ffffff',
  };
}