import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthState } from "@/store/auth/authSlice";
import { fetchMyCart, resetCartState } from "@/store/cart/cartSlice";
export { useCart } from "@/hooks/cart/useCart";
function CartProvider({ children }) {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }

    if (!auth.accessToken || auth.user?.role !== "customer") {
      dispatch(resetCartState());
      return;
    }

    void dispatch(fetchMyCart());
  }, [auth.accessToken, auth.isReady, auth.user?.role, dispatch]);

  return <>{children}</>;
}
export {
  CartProvider
};
