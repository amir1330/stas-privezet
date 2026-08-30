"use client";

interface Props {
  variant?: "shoe" | "clothing";
}

export function SizeGuideLinks({ variant = "shoe" }: Props) {
  const sizeLabel =
    variant === "clothing" ? "Как определить размер одежды" : "Как определить размер обуви";

  return (
    <div className="product-size-guide-links">
      <a href="/support" className="product-size-guide-links__item">
        {sizeLabel}
      </a>
      <a href="/support" className="product-size-guide-links__item">
        Этот товар можно вернуть, если он вам не подойдёт
      </a>
    </div>
  );
}
