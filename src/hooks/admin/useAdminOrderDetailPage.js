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
      title: "Doi trang thai don",
      message: "Chon trang thai don hop le va luu ghi chu neu can.",
      okText: "Cap nhat",
      fields: [
        {
          name: "orderStatus",
          label: "Trang thai don",
          type: "select",
          required: true,
          options: ADMIN_ORDER_STATUSES.map((status) => ({ value: status, label: status })),
        },
        {
          name: "note",
          label: "Ghi chu",
          type: "textarea",
          placeholder: "Them ghi chu...",
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
            note: formValues.note?.trim() || "Updated by admin",
          },
        }),
      ).unwrap();
      await refresh();
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc trang thai don.");
    }
  }

  async function updateShippingStatus() {
    const formValues = await popupForm({
      title: "Doi trang thai van chuyen",
      message: "Chon trang thai van chuyen hop le.",
      okText: "Cap nhat",
      fields: [
        {
          name: "shippingStatus",
          label: "Trang thai van chuyen",
          type: "select",
          required: true,
          options: ADMIN_SHIPPING_STATUSES.map((status) => ({ value: status, label: status })),
        },
        {
          name: "note",
          label: "Ghi chu",
          type: "textarea",
          placeholder: "Them ghi chu giao hang...",
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
            note: formValues.note?.trim() || "Updated by admin",
          },
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
      backToOrders: () => navigate(orderBasePath),
      retry: refresh,
      updateOrderStatus,
      updateShippingStatus,
    },
    popupElement,
  };
}
