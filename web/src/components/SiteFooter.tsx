import Link from "next/link";

const SHOP_LINKS = [
  "Магазин в Москве",
  "Оплата",
  "Доставка",
  "Помощь",
  "Гарантия и безопасность",
  "Проверка на оригинальность",
  "Как выбрать размер",
  "Как ухаживать за вещами",
];

const CATALOG_LINKS = ["Кроссовки", "Все бренды", "Air Jordan", "Nike", "New Balance", "Adidas", "Asics"];

const COMPANY_LINKS = ["Приложение", "Команда", "Отзывы", "Контакты"];

const BRAND_LINKS = ["Nike", "Air Jordan", "New Balance", "Asics", "Puma", "Adidas", "Converse"];

const LEGAL_LINKS = [
  "Карта сайта",
  "Политика конфиденциальности",
  "Оферта",
  "Пользовательское соглашение",
  "Согласие на обработку персональных данных",
  "Согласие на получение рекламных рассылок",
];

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-sm font-bold text-black">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <Link href="/catalog" className="text-sm text-[#717171] hover:text-black">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[#eaeaea] bg-white pt-8">
      <div className="px-[15px]">
        <Link
          href="/catalog"
          className="mb-6 flex items-center gap-3 rounded-tile bg-[#efedec] p-4 text-sm font-bold"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg">
            ✈
          </span>
          Приложение в Телеграме
        </Link>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn title="Магазин" links={SHOP_LINKS} />
          <FooterColumn title="Каталог" links={CATALOG_LINKS} />
          <FooterColumn title="Компания" links={COMPANY_LINKS} />
          <FooterColumn title="Бренды" links={BRAND_LINKS} />
        </div>

        <p className="mt-8 text-center text-xs text-[#717171]">© 2026 ООО «Юникорн»</p>

        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 pb-8">
          {LEGAL_LINKS.map((l) => (
            <Link key={l} href="/catalog" className="text-[10px] text-[#8d8d9a] hover:text-[#717171]">
              {l}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
