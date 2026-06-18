# FinNavi — Отложенные задачи

## Перед деплоем на продакшен

### Домен и ENV
- [ ] Зарегистрировать домен (finnavi.rs или аналог)
- [ ] Добавить в Vercel env-переменную: `NEXT_PUBLIC_BASE_URL=https://finnavi.rs`
- [ ] В `.env.local` для локальной разработки: `NEXT_PUBLIC_BASE_URL=http://192.168.1.79:3000`

### OG-картинка для Telegram/WhatsApp превью
- [ ] Создать `public/og-image.png` — размер **1200×630px**
- [ ] Содержимое: тёмный фон, логотип ExpatFinance, подзаголовок ("Финансы в Сербии без месяца поиска по форумам")
- [ ] Проверить превью: https://developers.facebook.com/tools/debug/ или https://t.me/iv?url=...

### Вкладка «Обменники»
- [ ] Убрать заглушку AltaPay или заменить честным placeholder ("Данные скоро появятся")
- [ ] Либо убрать вкладку из таб-навигации до появления реальных данных

## SEO (после запуска)
- [ ] `generateMetadata` для страниц продуктов (`/accounts/product/[id]`)
- [ ] `src/app/sitemap.ts` — автогенерация sitemap
- [ ] `src/app/robots.ts`
- [ ] Раздел `/guides` — SEO-статьи (5 приоритетных тем)

## Данные
- [ ] Верифицировать тарифы всех банков по официальным Cenovnik PDF
- [ ] Добавить банки: Erste, ProCredit, Halkbank
- [ ] Цвета / логотипы банков (`brand_color` в BankJSON)

## Прочее
- [ ] Удалить `BrokerCards.tsx` (устаревший Supabase-компонент)
- [ ] Favicon (`public/favicon.ico` / `icon.png`)
- [ ] Plausible Analytics — подключить после деплоя