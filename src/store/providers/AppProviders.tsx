import type { ReactNode } from "react";
import { AuthProvider } from "@/store/auth/AuthContext";
import { CartProvider } from "@/store/cart/CartContext";
import { CartDrawerProvider } from "@/store/cart/CartDrawerContext";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <CartDrawerProvider>{children}</CartDrawerProvider>
      </CartProvider>
    </AuthProvider>
  );
}
