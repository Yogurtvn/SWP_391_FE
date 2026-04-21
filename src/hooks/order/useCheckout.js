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
            .map(resolveCheckoutOrderType)
            .filter((value) => value.length > 0),
        ),
      ),
    [cart.items],
  );

  const checkoutItems = useMemo(
    () => {
      if (requestedOrderType) {
        return cart.items.filter((item) => resolveCheckoutOrderType(item) === requestedOrderType);
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
  const checkoutOrderType = requestedOrderType || resolveCheckoutOrderType(checkoutItems[0]);

  async function submitCheckout({ shippingInfo, paymentMethod, shippingFee = 0 }) {
    const payload = createCheckoutPayload({
      cartItems: checkoutItems,
      orderType: checkoutOrderType,
      shippingInfo,
      paymentMethod,
      shippingFee,
    });

    const result = await dispatch(checkoutReadyOrder(payload)).unwrap();

    return {
      result,
      orderSummary: buildOrderSummary({
        checkoutResult: result,
        cartItems: checkoutItems,
        orderType: checkoutOrderType,
        shippingInfo,
        paymentMethod,
        shippingFee,
      }),
    };
  }

  function createDraftSummary({ shippingInfo, paymentMethod, shippingFee = 0 }) {
    return buildOrderSummary({
      checkoutResult: null,
      cartItems: checkoutItems,
      orderType: checkoutOrderType,
      shippingInfo,
      paymentMethod,
      shippingFee,
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
  const normalizedOrderType = String(orderType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (normalizedOrderType === "preorder") {
    return "preorder";
  }

  if (normalizedOrderType === "prescription") {
    return "prescription";
  }

  return normalizedOrderType === "ready" ? "ready" : "";
}

function resolveCheckoutOrderType(item) {
  if (!item) {
    return "";
  }

  if (item.hasPrescription || item.itemType === "prescriptionConfigured") {
    return "prescription";
  }

  const explicitOrderType = normalizeOrderType(item.orderType);

  if (explicitOrderType === "preorder") {
    return "preorder";
  }

  if (explicitOrderType === "prescription") {
    return "prescription";
  }

  if (isPreOrderCandidate(item)) {
    return "preorder";
  }

  return "ready";
}

function isPreOrderCandidate(item) {
  if (!item?.isPreOrderAllowed) {
    return false;
  }

  if (item.isReadyAvailable === false) {
    return true;
  }

  const stockQuantity = Number(item.stockQuantity ?? item.quantity ?? 0);
  const quantity = Number(item.quantity ?? 0);

  return Number.isFinite(stockQuantity) && Number.isFinite(quantity) && quantity > stockQuantity;
}
