import { Provider } from "react-redux";
import { store } from "@/store/app/store";
import { AuthProvider } from "@/store/auth/AuthContext";
import { CartProvider } from "@/store/cart/CartContext";
import { CartDrawerProvider } from "@/store/cart/CartDrawerContext";
function AppProviders({ children }) {
  return <Provider store={store}>
      <AuthProvider>
        <CartProvider>
          <CartDrawerProvider>{children}</CartDrawerProvider>
        </CartProvider>
      </AuthProvider>
    </Provider>;
}
export {
  AppProviders
};
