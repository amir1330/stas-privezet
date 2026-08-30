"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StickyBuyBar } from "@/components/StickyBuyBar";
import { useStickyBuyBar } from "@/hooks/useStickyBuyBar";

export type ProductPurchaseSnapshot = {
  selectedSize: string | null;
  priceKrw: number | null;
  loading: boolean;
  submitted: boolean;
  onBuy: () => void;
};

type ProductChromeContextValue = {
  isProductPage: boolean;
  setProductPage: (value: boolean) => void;
  isCompact: boolean;
  setBuyTriggerElement: (el: HTMLElement | null) => void;
  purchase: ProductPurchaseSnapshot | null;
  setPurchase: (value: ProductPurchaseSnapshot | null) => void;
};

const ProductChromeContext = createContext<ProductChromeContextValue>({
  isProductPage: false,
  setProductPage: () => {},
  isCompact: false,
  setBuyTriggerElement: () => {},
  purchase: null,
  setPurchase: () => {},
});

export function useProductChrome() {
  return useContext(ProductChromeContext);
}

export function ProductChromeProvider({ children }: { children: ReactNode }) {
  const [isProductPage, setProductPage] = useState(false);
  const [buyTriggerEl, setBuyTriggerElement] = useState<HTMLElement | null>(null);
  const [purchase, setPurchase] = useState<ProductPurchaseSnapshot | null>(null);

  const isCompact = useStickyBuyBar(isProductPage ? buyTriggerEl : null);

  const setBuyTrigger = useCallback((el: HTMLElement | null) => {
    setBuyTriggerElement(el);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("product-compact-buy", isProductPage && isCompact);
    return () => document.body.classList.remove("product-compact-buy");
  }, [isProductPage, isCompact]);

  const value = useMemo(
    () => ({
      isProductPage,
      setProductPage,
      isCompact,
      setBuyTriggerElement: setBuyTrigger,
      purchase,
      setPurchase,
    }),
    [isProductPage, isCompact, setBuyTrigger, purchase],
  );

  return (
    <ProductChromeContext.Provider value={value}>
      {children}
      {purchase && isCompact && (
        <StickyBuyBar
          selectedSize={purchase.selectedSize}
          priceKrw={purchase.priceKrw}
          loading={purchase.loading}
          submitted={purchase.submitted}
          onBuy={purchase.onBuy}
        />
      )}
    </ProductChromeContext.Provider>
  );
}
