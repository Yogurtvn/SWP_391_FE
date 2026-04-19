import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  fetchAdminOrders,
  patchAdminOrderStatus,
  patchAdminShippingStatus,
  selectAdminState,
} from "@/store/admin/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export const ADMIN_ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "AwaitingStock",
  "Processing",
  "Shipped",
  "Completed",
  "Cancelled",
];

export const ADMIN_SHIPPING_STATUSES = [
  "Pending",
  "Picking",
  "Delivering",
  "Delivered",
  "Failed",
];

export function useAdminOrdersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupPrompt, popupElement } = usePopupDialog();

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: "",
    orderStatus: "",
    shippingStatus: "",
  });

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }

    if (!auth.accessToken) {
      return;
    }

    void dispatch(
      fetchAdminOrders({
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search.trim() || undefined,
        orderStatus: filters.orderStatus || undefined,
        shippingStatus: filters.shippingStatus || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    );
  }, [auth.accessToken, auth.isReady, dispatch, filters]);

  function setFilter(field, value) {
    setFilters((current) => ({
      ...current,
      page: field === "page" ? value : 1,
      [field]: value,
    }));
  }

  async function updateOrderStatus(orderId) {
    const nextStatus = await popupPrompt(
      `Nhap trang thai moi (${ADMIN_ORDER_STATUSES.join(", ")}):`,
      "",
      { title: "Doi trang thai don", okText: "Cap nhat" },
    );

    if (!nextStatus) {
      return;
    }

    try {
      await dispatch(
        patchAdminOrderStatus({
          orderId,
          payload: { orderStatus: nextStatus, note: "Updated by admin" },
        }),
      ).unwrap();

      await dispatch(
        fetchAdminOrders({
          page: filters.page,
          pageSize: filters.pageSize,
          search: filters.search.trim() || undefined,
          orderStatus: filters.orderStatus || undefined,
          shippingStatus: filters.shippingStatus || undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc trang thai don.");
    }
  }

  async function updateShippingStatus(orderId) {
    const nextStatus = await popupPrompt(
      `Nhap trang thai van chuyen (${ADMIN_SHIPPING_STATUSES.join(", ")}):`,
      "",
      { title: "Doi trang thai van chuyen", okText: "Cap nhat" },
    );

    if (!nextStatus) {
      return;
    }

    try {
      await dispatch(
        patchAdminShippingStatus({
          orderId,
          payload: { shippingStatus: nextStatus },
        }),
      ).unwrap();

      await dispatch(
        fetchAdminOrders({
          page: filters.page,
          pageSize: filters.pageSize,
          search: filters.search.trim() || undefined,
          orderStatus: filters.orderStatus || undefined,
          shippingStatus: filters.shippingStatus || undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ).unwrap();
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc trang thai van chuyen.");
    }
  }

  return {
    orders: admin.orders.items,
    filters,
    pageInfo: {
      page: admin.orders.page,
      totalPages: admin.orders.totalPages,
    },
    ui: {
      error: admin.orders.error ?? (!auth.accessToken && auth.isReady ? "Khong co access token." : null),
      isLoading: admin.orders.status === "loading",
    },
    actions: {
      setFilter,
      retry: () =>
        dispatch(
          fetchAdminOrders({
            page: filters.page,
            pageSize: filters.pageSize,
            search: filters.search.trim() || undefined,
            orderStatus: filters.orderStatus || undefined,
            shippingStatus: filters.shippingStatus || undefined,
            sortBy: "createdAt",
            sortOrder: "desc",
          }),
        ),
      goToDetail: (orderId) => navigate(`/admin/orders/${orderId}`),
      updateOrderStatus,
      updateShippingStatus,
    },
    popupElement,
  };
}
