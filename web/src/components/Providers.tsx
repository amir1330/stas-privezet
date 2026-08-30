"use client";

import { AuthProvider } from "@/lib/auth";
import { AdminEditProvider } from "@/lib/admin-edit";
import { LocaleProvider } from "@/lib/locale";
import { ProductChromeProvider } from "@/lib/product-chrome";
import { InlineAdminEditor } from "@/components/InlineAdminEditor";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <AdminEditProvider>
          <ProductChromeProvider>
            {children}
            <InlineAdminEditor />
          </ProductChromeProvider>
        </AdminEditProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
