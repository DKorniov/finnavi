// src/components/Footer.tsx
import Link from "next/link";

const GUIDES = [
  { name: "Prenesi: какие банки поддерживают", url: "/guides/kak-eto-rabotaet/prenesi" },
];

const OFFICIAL_SOURCES = [
  {
    name: "НБС (Народна банка Србије)",
    desc: "Регулятор, статистика, нормативные акты",
    url: "https://www.nbs.rs",
  },
  {
    name: "DinaCard",
    desc: "Национальная платёжная система",
    url: "https://dinacard.nbs.rs",
  },
  {
    name: "IPS НБС",
    desc: "Система мгновенных платежей",
    url: "https://www.nbs.rs/sr_RS/ciljevi-i-funkcije/platni-sistem/nbs-operator/ips-nbs/",
  },
  {
    name: "Prenesi",
    desc: "Перевод по номеру телефона (часть IPS НБС)",
    url: "https://ips.nbs.rs/",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <Link href="/" className="font-extrabold text-lg tracking-tight text-slate-900">
              Expat<span className="text-emerald-500">Finance</span>
            </Link>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Информационный агрегатор банковских, инвестиционных и налоговых продуктов
              для русскоязычных экспатов в Сербии. Не банк, не брокер, не финансовый советник.
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Гайды
            </h3>
            <ul className="space-y-2">
              {GUIDES.map(g => (
                <li key={g.url}>
                  <Link href={g.url} className="text-xs text-slate-600 hover:text-slate-900 transition-colors leading-snug">
                    {g.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Официальные источники
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OFFICIAL_SOURCES.map(src => (
                <a
                  key={src.name}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 hover:border-slate-300 hover:bg-slate-100/60 transition-colors"
                >
                  <p className="text-xs font-semibold text-slate-800">{src.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{src.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} ExpatFinance Navigator. Данные требуют верификации перед принятием решений.
          </p>
        </div>
      </div>
    </footer>
  );
}