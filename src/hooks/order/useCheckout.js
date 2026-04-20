import { useMemo } from "react";
import { useLocation } from "react-router";
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
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const order = useAppSelector(selectOrderState);
  const cart = useCart();
  const requestedOrderType = normalizeOrderType(location.state?.orderType);

  const orderTypes = useMemo(
    () =>
      Array.from(
        new Set(
          cart.items
            .map((item) => normalizeOrderType(item?.orderType))
            .filter((value) => value.length > 0),
        ),
      ),
    [cart.items],
  );

  const checkoutItems = useMemo(
    () => {
      if (requestedOrderType) {
        return cart.items.filter((item) => normalizeOrderType(item?.orderType) === requestedOrderType);
      }

      return orderTypes.length === 1 ? cart.items : [];
    },
    [cart.items, orderTypes.length, requestedOrderType],
  );

  const blockedItems = useMemo(
    () => {
      if (requestedOrderType) {
        return [];
      }

      return orderTypes.length <= 1 ? [] : cart.items;
    },
    [cart.items, orderTypes.length, requestedOrderType],
  );

  const itemCount = useMemo(
    () => checkoutItems.reduce((count, item) => count + Number(item?.quantity ?? 0), 0),
    [checkoutItems],
  );

  const subtotal = useMemo(
    () => checkoutItems.reduce((total, item) => total + Number(item?.totalPrice ?? 0), 0),
    [checkoutItems],
  );

  const shippingFee = 0;
  const checkoutOrderType = requestedOrderType || normalizeOrderType(checkoutItems[0]?.orderType);

  async function submitCheckout({ shippingInfo, paymentMethod }) {
    const payload = createCheckoutPayload({
      cartItems: checkoutItems,
      shippingInfo,
      paymentMethod,
    });

    const result = await dispatch(checkoutReadyOrder(payload)).unwrap();

    return {
      result,
      orderSummary: buildOrderSummary({
        checkoutResult: result,
        cartItems: checkoutItems,
        shippingInfo,
        paymentMethod,
      }),
    };
  }

  function createDraftSummary({ shippingInfo, paymentMethod }) {
    return buildOrderSummary({
      checkoutResult: null,
      cartItems: checkoutItems,
      shippingInfo,
      paymentMethod,
    });
  }

  return {
    isCustomerSession: Boolean(auth?.accessToken) && auth?.user?.role === "customer",
    checkoutItems,
    blockedItems,
    checkoutOrderType,
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

function normalizeOrderType(orderType) {
  return String(orderType ?? "").trim().toLowerCase();
}
