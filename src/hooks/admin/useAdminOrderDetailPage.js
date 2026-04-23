import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
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
import { getOrderStatusPresentation, getShippingStatusPresentation } from "@/utils/orderStatus";

export function useAdminOrderDetailPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupForm, popupElement } = usePopupDialog();
  const orderBasePath = location.pathname.startsWith("/staff") ? "/staff/orders" : "/admin/orders";

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
    const formValues = await popupForm({
      title: "Đổi trạng thái đơn",
      message: "Chọn trạng thái đơn hợp lệ và lưu ghi chú nếu cần.",
      okText: "Cập nhật",
      fields: [
        {
          name: "orderStatus",
          label: "Trạng thái đơn",
          type: "select",
          required: true,
          options: ADMIN_ORDER_STATUSES.map((status) => {
            const presentation = getOrderStatusPresentation(status);
            return { value: status, label: presentation.label, className: presentation.className };
          }),
        },
        {
          name: "note",
          label: "Ghi chú",
          type: "textarea",
          placeholder: "Thêm ghi chú...",
        },
      ],
      initialValues: {
        orderStatus: admin.currentOrder.data?.orderStatus || ADMIN_ORDER_STATUSES[0],
        note: "",
      },
    });

    if (!formValues || !orderId) {
      return;
    }

    try {
      await dispatch(
        patchAdminOrderStatus({
          orderId: Number(orderId),
          payload: {
            orderStatus: formValues.orderStatus,
            note: formValues.note?.trim() || undefined,
          },
        }),
      ).unwrap();
      await refresh();
    } catch (error) {
      await popupAlert(error || "Không cập nhật được trạng thái đơn.");
    }
  }

  async function updateShippingStatus() {
    const formValues = await popupForm({
      title: "Đổi trạng thái vận chuyển",
      message: "Chọn trạng thái vận chuyển hợp lệ.",
      okText: "Cập nhật",
      fields: [
        {
          name: "shippingStatus",
          label: "Trạng thái vận chuyển",
          type: "select",
          required: true,
          options: ADMIN_SHIPPING_STATUSES.map((status) => {
            const presentation = getShippingStatusPresentation(status);
            return { value: status, label: presentation.label, className: presentation.className };
          }),
        },
        {
          name: "note",
          label: "Ghi chú",
          type: "textarea",
          placeholder: "Thêm ghi chú giao hàng...",
        },
      ],
      initialValues: {
        shippingStatus: admin.currentOrder.data?.shippingStatus || ADMIN_SHIPPING_STATUSES[0],
        note: "",
      },
    });

    if (!formValues || !orderId) {
      return;
    }

    try {
      await dispatch(
        patchAdminShippingStatus({
          orderId: Number(orderId),
          payload: {
            shippingStatus: formValues.shippingStatus,
            note: formValues.note?.trim() || undefined,
          },
        }),
      ).unwrap();
      await refresh();
    } catch (error) {
      await popupAlert(error || "Không cập nhật được trạng thái vận chuyển.");
    }
  }

  return {
    orderId,
    order: admin.currentOrder.data,
    ui: {
      error: admin.currentOrder.error ?? (!auth.accessToken && auth.isReady ? "Không có access token." : null),
      isLoading: admin.currentOrder.status === "loading",
    },
    actions: {
      backToOrders: () => navigate(orderBasePath),
      retry: refresh,
      updateOrderStatus,
      updateShippingStatus,
    },
    popupElement,
  };
}
