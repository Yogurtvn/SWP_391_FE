import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  fetchAdminOrderDetail,
  patchAdminOrderStatus,
  patchAdminShippingStatus,
  selectAdminState,
} from "@/store/admin/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { ADMIN_ORDER_STATUSES, ADMIN_SHIPPING_STATUSES } from "@/hooks/admin/useAdminOrdersPage";

export function useAdminOrderDetailPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupPrompt, popupElement } = usePopupDialog();

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken || !orderId) {
      return;
    }

    void dispatch(fetchAdminOrderDetail(orderId));
  }, [auth.accessToken, auth.isReady, dispatch, orderId]);

  async function refresh() {
    if (!orderId) {
      return;
    }

    await dispatch(fetchAdminOrderDetail(orderId)).unwrap();
  }

  async function updateOrderStatus() {
    const nextStatus = await popupPrompt(
      `Nhap trang thai moi (${ADMIN_ORDER_STATUSES.join(", ")}):`,
      admin.currentOrder.data?.orderStatus || "",
      { title: "Doi trang thai don", okText: "Cap nhat" },
    );

    if (!nextStatus || !orderId) {
      return;
    }

    try {
      await dispatch(
        patchAdminOrderStatus({
          orderId: Number(orderId),
          payload: { orderStatus: nextStatus, note: "Updated by admin" },
        }),
      ).unwrap();
      await refresh();
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc trang thai don.");
    }
  }

  async function updateShippingStatus() {
    const nextStatus = await popupPrompt(
      `Nhap trang thai van chuyen moi (${ADMIN_SHIPPING_STATUSES.join(", ")}):`,
      admin.currentOrder.data?.shippingStatus || "",
      { title: "Doi trang thai van chuyen", okText: "Cap nhat" },
    );

    if (!nextStatus || !orderId) {
      return;
    }

    try {
      await dispatch(
        patchAdminShippingStatus({
          orderId: Number(orderId),
          payload: { shippingStatus: nextStatus, note: "Updated by admin" },
        }),
      ).unwrap();
      await refresh();
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc trang thai van chuyen.");
    }
  }

  return {
    orderId,
    order: admin.currentOrder.data,
    ui: {
      error: admin.currentOrder.error ?? (!auth.accessToken && auth.isReady ? "Khong co access token." : null),
      isLoading: admin.currentOrder.status === "loading",
    },
    actions: {
      backToOrders: () => navigate("/admin/orders"),
      retry: refresh,
      updateOrderStatus,
      updateShippingStatus,
    },
    popupElement,
  };
}
