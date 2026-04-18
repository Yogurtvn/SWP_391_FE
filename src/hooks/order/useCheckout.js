import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthState } from "@/store/auth/authSlice";
import { useCart } from "@/hooks/cart/useCart";
import {
  buildOrderSummary,
  createCheckoutPayload,
} from "@/services/orderService";
import {
  checkoutReadyOrder,
  clearCheckoutState,
  selectOrderState,
} from "@/store/order/orderSlice";

export function useCheckout() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const order = useAppSelector(selectOrderState);
  const cart = useCart();

  const readyItems = useMemo(
    () =>
      cart.items.filter(
        (item) => item?.orderType === "ready" && item?.itemType === "standard" && !item?.hasPrescription,
      ),
    [cart.items],
  );

  const blockedItems = useMemo(
    () =>
      cart.items.filter(
        (item) => item?.orderType !== "ready" || item?.itemType !== "standard" || Boolean(item?.hasPrescription),
      ),
    [cart.items],
  );

  const itemCount = useMemo(
    () => readyItems.reduce((count, item) => count + Number(item?.quantity ?? 0), 0),
    [readyItems],
  );

  const subtotal = useMemo(
    () => readyItems.reduce((total, item) => total + Number(item?.totalPrice ?? 0), 0),
    [readyItems],
  );

  const shippingFee = 0;

  async function submitCheckout({ shippingInfo, paymentMethod }) {
    const payload = createCheckoutPayload({
      cartItems: readyItems,
      shippingInfo,
      paymentMethod,
    });

    const result = await dispatch(checkoutReadyOrder(payload)).unwrap();

    return {
      result,
      orderSummary: buildOrderSummary({
        checkoutResult: result,
        cartItems: readyItems,
        shippingInfo,
        paymentMethod,
      }),
    };
  }

  function createDraftSummary({ shippingInfo, paymentMethod }) {
    return buildOrderSummary({
      checkoutResult: null,
      cartItems: readyItems,
      shippingInfo,
      paymentMethod,
    });
  }

  return {
    isCustomerSession: Boolean(auth?.accessToken) && auth?.user?.role === "customer",
    readyItems,
    blockedItems,
    itemCount,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    cartStatus: cart.status,
    checkoutStatus: order.checkoutStatus,
    checkoutError: order.checkoutError,
    submitCheckout,
    createDraftSummary,
    clearCheckout: () => dispatch(clearCheckoutState()),
  };
}
