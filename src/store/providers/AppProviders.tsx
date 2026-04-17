import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/app/store";
import { AuthProvider } from "@/store/auth/AuthContext";
import { CartProvider } from "@/store/cart/CartContext";
import { CartDrawerProvider } from "@/store/cart/CartDrawerContext";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <CartProvider>
          <CartDrawerProvider>{children}</CartDrawerProvider>
        </CartProvider>
      </AuthProvider>
    </Provider>
  );
}
