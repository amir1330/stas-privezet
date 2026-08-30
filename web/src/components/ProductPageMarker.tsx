"use client";

import { useEffect } from "react";
import { useProductChrome } from "@/lib/product-chrome";

/** Marks current route as product page so header + sticky buy bar activate. */
export function ProductPageMarker({ children }: { children: React.ReactNode }) {
  const { setProductPage, setPurchase, setBuyTriggerElement } = useProductChrome();

  useEffect(() => {
    setProductPage(true);
    return () => {
      setProductPage(false);
      setPurchase(null);
      setBuyTriggerElement(null);
    };
  }, [setProductPage, setPurchase, setBuyTriggerElement]);

  return children;
}
