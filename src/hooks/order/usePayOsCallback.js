import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { getOrderById, normalizeOrderDetail } from "@/services/orderService";
import {
  getPaymentByPayOsOrderCode,
  reconcilePayOsPaymentByOrderCode,
} from "@/services/paymentService";
import { selectAuthState } from "@/store/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

const INITIAL_LOOKUP_STATE = {
  status: "idle",
  error: null,
  order: null,
  payment: null,
};

export function usePayOsCallback(fallbackOrderSummary = null) {
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const [lookupState, setLookupState] = useState(INITIAL_LOOKUP_STATE);

  const callback = useMemo(() => parsePayOsCallback(location.search), [location.search]);

  useEffect(() => {
    if (!callback.isPayOsCallback) {
      setLookupState(INITIAL_LOOKUP_STATE);
      return;
    }

    if (!auth.isReady) {
      return;
    }

    if (!auth.accessToken || !callback.orderCode) {
      setLookupState({
        status: "failed",
        error: !auth.accessToken
          ? "Vui lòng đăng nhập để xem kết quả thanh toán PayOS."
          : "Không tìm thấy mã giao dịch PayOS hợp lệ.",
        order: null,
        payment: null,
      });
      return;
    }

    let isCancelled = false;

    async function loadCallbackState() {
      setLookupState({
        status: "loading",
        error: null,
        order: null,
        payment: null,
      });

      try {
        const payment = await loadPaymentAfterPayOsReturn(auth.accessToken, callback.orderCode);
        const orderResponse = await getOrderById(auth.accessToken, payment.orderId);
        const order = normalizeOrderDetail(orderResponse);

        if (isCancelled) {
          return;
        }

        setLookupState({
          status: "succeeded",
          error: null,
          order,
          payment,
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setLookupState({
          status: "failed",
          error: getCallbackErrorMessage(error, callback),
          order: null,
          payment: null,
        });
      }
    }

    void loadCallbackState();

    return () => {
      isCancelled = true;
    };
  }, [auth.accessToken, auth.isReady, callback]);

  const orderSummary = useMemo(() => {
    if (lookupState.order) {
      return buildOrderSummaryFromOrderDetail(lookupState.order, fallbackOrderSummary);
    }

    return fallbackOrderSummary;
  }, [fallbackOrderSummary, lookupState.order]);

  return {
    authRequired: callback.isPayOsCallback && auth.isReady && !auth.accessToken,
    callback,
    isExternalCallback: callback.isPayOsCallback,
    lookup: lookupState,
    orderSummary,
  };
}

function parsePayOsCallback(search) {
  const searchParams = new URLSearchParams(search ?? "");
  const rawOrderCode = searchParams.get("orderCode");
  const rawCancel = searchParams.get("cancel");

  return {
    code: normalizeText(searchParams.get("code")),
    status: normalizeText(searchParams.get("status")),
    paymentLinkId: normalizeText(searchParams.get("id")),
    cancel: rawCancel === "true",
    orderCode: parsePositiveInteger(rawOrderCode),
    isPayOsCallback:
      searchParams.has("orderCode")
      || searchParams.has("status")
      || searchParams.has("cancel")
      || searchParams.has("id")
      || searchParams.has("code"),
  };
}

function buildOrderSummaryFromOrderDetail(order, fallbackOrderSummary) {
  return {
    orderId: Number(order?.orderId ?? 0),
    orderCreated: Number(order?.orderId ?? 0) > 0,
    orderStatus: order?.orderStatus ?? "pending",
    orderStatusLabel: order?.orderStatusLabel ?? "Chờ xác nhận",
    paymentMethod: order?.payment?.paymentMethod ?? fallbackOrderSummary?.paymentMethod ?? "payos",
    paymentMethodLabel: order?.payment?.paymentMethodLabel ?? fallbackOrderSummary?.paymentMethodLabel ?? "Thanh toán PayOS",
    paymentStatus: order?.payment?.paymentStatus ?? fallbackOrderSummary?.paymentStatus ?? "pending",
    paymentStatusLabel: order?.payment?.paymentStatusLabel ?? fallbackOrderSummary?.paymentStatusLabel ?? "Chờ thanh toán",
    itemCount: Number(order?.itemCount ?? fallbackOrderSummary?.itemCount ?? 0),
    total: Number(order?.totalAmount ?? fallbackOrderSummary?.total ?? 0),
    customerName: order?.receiverName ?? fallbackOrderSummary?.customerName ?? "Khách hàng Vision Direct",
    phone: order?.receiverPhone ?? fallbackOrderSummary?.phone ?? "Chưa cập nhật",
    email: fallbackOrderSummary?.email ?? "Chưa cập nhật",
    shippingAddress: order?.shippingAddress ?? fallbackOrderSummary?.shippingAddress ?? "Địa chỉ giao hàng sẽ được cập nhật sau.",
    createdAtLabel: order?.createdAtLabel ?? fallbackOrderSummary?.createdAtLabel ?? "Chưa cập nhật",
  };
}

function getCallbackErrorMessage(error, callback) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (callback.cancel || callback.status === "CANCELLED") {
    return "Thanh toán PayOS đã bị hủy hoặc chưa hoàn tất.";
  }

  return "Không thể đồng bộ kết quả thanh toán PayOS từ hệ thống.";
}

async function loadPaymentAfterPayOsReturn(token, orderCode) {
  try {
    return await reconcilePayOsPaymentByOrderCode(token, orderCode);
  } catch (error) {
    return getPaymentByPayOsOrderCode(token, orderCode);
  }
}

function parsePositiveInteger(value) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function normalizeText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}


