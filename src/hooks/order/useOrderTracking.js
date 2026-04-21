import { useEffect, useMemo } from "react";
import { useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  clearCurrentOrder,
  fetchOrderDetail,
  selectOrderState,
} from "@/store/order/orderSlice";
import {
  clearPrescriptionResubmitState,
  resubmitCustomerPrescription,
  selectPrescriptionResubmitState,
} from "@/store/prescription/prescriptionSlice";

export function useOrderTracking() {
  const { orderId } = useParams();
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const orderState = useAppSelector(selectOrderState);
  const prescriptionResubmit = useAppSelector(selectPrescriptionResubmitState);

  const numericOrderId = useMemo(() => Number.parseInt(String(orderId ?? ""), 10), [orderId]);
  const hasValidOrderId = Number.isFinite(numericOrderId) && numericOrderId > 0;

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }

    if (!auth.accessToken || !hasValidOrderId) {
      dispatch(clearCurrentOrder());
      return;
    }

    void dispatch(fetchOrderDetail(numericOrderId));
  }, [auth.accessToken, auth.isReady, dispatch, hasValidOrderId, numericOrderId]);

  return {
    order: orderState.currentOrder,
    prescriptionResubmit,
    authRequired: auth.isReady && !auth.accessToken,
    ui: {
      isLoading: orderState.currentOrderStatus === "loading",
      error: !hasValidOrderId
        ? "Mã đơn hàng không hợp lệ."
        : orderState.currentOrderError,
    },
    actions: {
      retry: () => {
        if (hasValidOrderId) {
          void dispatch(fetchOrderDetail(numericOrderId));
        }
      },
      resubmitPrescription: async ({ prescriptionId, formState, imageFile, existingImageUrl }) => {
        await dispatch(resubmitCustomerPrescription({
          prescriptionId,
          formState,
          imageFile,
          existingImageUrl,
        })).unwrap();

        if (hasValidOrderId) {
          await dispatch(fetchOrderDetail(numericOrderId)).unwrap();
        }
      },
      clearPrescriptionResubmit: (prescriptionId) => {
        dispatch(clearPrescriptionResubmitState(prescriptionId));
      },
    },
  };
}

