import { RouterProvider } from "react-router";
import { router } from "./routes";
import { CartProvider } from "./context/CartContext";
import { CartDrawerProvider } from "./context/CartDrawerContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CartDrawerProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </CartDrawerProvider>
      </CartProvider>
    </AuthProvider>
  );
}