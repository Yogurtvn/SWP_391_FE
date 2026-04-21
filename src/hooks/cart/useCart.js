import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addPrescriptionCartItem,
  addStandardCartItem,
  clearMyCart,
  deleteCartItem,
  fetchMyCart,
  selectCartState,
  updatePrescriptionCartItem,
  updateCartItemQuantity,
} from "@/store/cart/cartSlice";
import { selectAuthState } from "@/store/auth/authSlice";

export function useCart() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCartState);
  const auth = useAppSelector(selectAuthState);

  const itemCount = useMemo(
    () => cart.items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
    [cart.items],
  );

  return {
    ...cart,
    isCustomerSession: Boolean(auth.accessToken) && auth.user?.role === "customer",
    addStandardItem: (payload) => dispatch(addStandardCartItem(payload)).unwrap(),
    addPrescriptionItem: (payload) => dispatch(addPrescriptionCartItem(payload)).unwrap(),
    updateQuantity: (cartItemId, quantity) =>
      dispatch(updateCartItemQuantity({ cartItemId, quantity })).unwrap(),
    updatePrescriptionItem: (payload) =>
      dispatch(updatePrescriptionCartItem(payload)).unwrap(),
    removeItem: (cartItemId, itemType = "standard") =>
      dispatch(deleteCartItem({ cartItemId, itemType })).unwrap(),
    clearCart: () => dispatch(clearMyCart()).unwrap(),
    refreshCart: () => dispatch(fetchMyCart()).unwrap(),
    getTotal: () => Number(cart.subTotal ?? 0),
    getItemCount: () => itemCount,
  };
}
