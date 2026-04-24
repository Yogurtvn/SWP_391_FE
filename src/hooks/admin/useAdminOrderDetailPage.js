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
import { getOrderStatusPresentation, getShippingStatusPresentation } from "@/utils/orderStatus";
import { getAllowedAdminOrderTransitions, getAllowedShippingStatuses } from "@/utils/orderWorkflowPolicy";

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
    const availableOrderStatuses = getAllowedAdminOrderTransitions(admin.currentOrder.data);

    if (availableOrderStatuses.length === 0) {
      await popupAlert("Đơn hàng hiện không có transition trạng thái hợp lệ.");
      return;
    }

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
          options: availableOrderStatuses.map((status) => {
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
        orderStatus: availableOrderStatuses.includes(admin.currentOrder.data?.orderStatus)
          ? admin.currentOrder.data.orderStatus
          : availableOrderStatuses[0],
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
    const availableShippingStatuses = getAllowedShippingStatuses(admin.currentOrder.data);

    if (availableShippingStatuses.length === 0) {
      await popupAlert("Đơn hàng hiện không cho phép cập nhật trạng thái vận chuyển.");
      return;
    }

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
          options: availableShippingStatuses.map((status) => {
            const presentation = getShippingStatusPresentation(status);
            return { value: status, label: presentation.label, className: presentation.className };
          }),
        },
        {
          name: "shippingCode",
          label: "Mã vận đơn",
          type: "text",
          placeholder: "Mã vận đơn (optional)",
        },
        {
          name: "expectedDeliveryDate",
          label: "Ngày giao dự kiến",
          type: "datetime-local",
        },
      ],
      initialValues: {
        shippingStatus: availableShippingStatuses.includes(admin.currentOrder.data?.shippingStatus)
          ? admin.currentOrder.data.shippingStatus
          : availableShippingStatuses[0],
        shippingCode: admin.currentOrder.data?.shippingCode ?? "",
        expectedDeliveryDate: admin.currentOrder.data?.expectedDeliveryDate
          ? new Date(admin.currentOrder.data.expectedDeliveryDate).toISOString().slice(0, 16)
          : "",
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
            shippingCode: formValues.shippingCode?.trim() || undefined,
            expectedDeliveryDate: formValues.expectedDeliveryDate
              ? new Date(formValues.expectedDeliveryDate).toISOString()
              : undefined,
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
