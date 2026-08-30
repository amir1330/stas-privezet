import Link from "next/link";

export function GiftCertPromo() {
  return (
    <section className="px-[15px] pb-8">
      <div className="overflow-hidden rounded-tile bg-[#efedec]">
        <div className="p-5">
          <h2 className="text-lg font-extrabold text-black">Подарочные сертификаты</h2>
          <p className="mt-2 text-sm text-[#717171] leading-relaxed">
            Идеальный подарок к новому году для друзей и близких! Выберите номинал от 5 000 до 50 000 рублей.
          </p>
          <Link
            href="/catalog"
            className="anim-black-cta mt-4 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
          >
            Подробнее
          </Link>
        </div>
      </div>
    </section>
  );
}
