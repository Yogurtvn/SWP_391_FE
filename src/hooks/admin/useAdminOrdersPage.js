import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  clearAdminCurrentOrder,
  fetchAdminOrderDetail,
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

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function useAdminOrdersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAppSelector(selectAuthState);
  const admin = useAppSelector(selectAdminState);
  const { popupAlert, popupForm, popupElement } = usePopupDialog();
  const orderBasePath = location.pathname.startsWith("/staff") ? "/staff/orders" : "/admin/orders";

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    search: "",
    orderStatus: "",
    shippingStatus: "",
  });
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  async function refreshOrders() {
    return dispatch(
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
  }

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void refreshOrders();
  }, [auth.accessToken, auth.isReady, filters.page, filters.pageSize, filters.search, filters.orderStatus, filters.shippingStatus]);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken || !selectedOrderId) {
      return;
    }

    void dispatch(fetchAdminOrderDetail(selectedOrderId));
  }, [auth.accessToken, auth.isReady, dispatch, selectedOrderId]);

  useEffect(() => {
    return () => {
      dispatch(clearAdminCurrentOrder());
    };
  }, [dispatch]);

  const filteredOrders = useMemo(() => {
    if (typeFilter === "all") {
      return admin.orders.items;
    }

    return admin.orders.items.filter((order) => normalizeValue(order.orderType) === normalizeValue(typeFilter));
  }, [admin.orders.items, typeFilter]);

  const orderTypeOptions = useMemo(() => {
    const typeMap = new Map();
    admin.orders.items.forEach((order) => {
      if (order?.orderType) {
        typeMap.set(normalizeValue(order.orderType), order.orderType);
      }
    });

    return Array.from(typeMap.values());
  }, [admin.orders.items]);

  const selectedOrderSummary = useMemo(
    () => filteredOrders.find((order) => String(order.orderId) === String(selectedOrderId)) ?? null,
    [filteredOrders, selectedOrderId],
  );

  const currentOrder =
    String(admin.currentOrder.data?.orderId ?? "") === String(selectedOrderId ?? "")
      ? admin.currentOrder.data
      : null;

  function setFilter(field, value) {
    setFilters((current) => ({
      ...current,
      page: field === "page" ? value : 1,
      [field]: value,
    }));
  }

  async function updateOrderStatus(orderId) {
    const formValues = await popupForm({
      title: "Doi trang thai don",
      message: "Chon trang thai hop le va them ghi chu neu can.",
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
          placeholder: "Them ghi chu cho lich su cap nhat...",
        },
      ],
      initialValues: {
        orderStatus: currentOrder?.orderStatus || selectedOrderSummary?.orderStatus || ADMIN_ORDER_STATUSES[0],
        note: "",
      },
    });

    if (!formValues) {
      return;
    }

    try {
      await dispatch(
        patchAdminOrderStatus({
          orderId,
          payload: {
            orderStatus: formValues.orderStatus,
            note: formValues.note?.trim() || "Updated by admin",
          },
        }),
      ).unwrap();

      await refreshOrders();

      if (selectedOrderId && String(selectedOrderId) === String(orderId)) {
        await dispatch(fetchAdminOrderDetail(orderId)).unwrap();
      }
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc trang thai don.");
    }
  }

  async function updateShippingStatus(orderId) {
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
        shippingStatus: currentOrder?.shippingStatus || selectedOrderSummary?.shippingStatus || ADMIN_SHIPPING_STATUSES[0],
        note: "",
      },
    });

    if (!formValues) {
      return;
    }

    try {
      await dispatch(
        patchAdminShippingStatus({
          orderId,
          payload: {
            shippingStatus: formValues.shippingStatus,
            note: formValues.note?.trim() || "Updated by admin",
          },
        }),
      ).unwrap();

      await refreshOrders();

      if (selectedOrderId && String(selectedOrderId) === String(orderId)) {
        await dispatch(fetchAdminOrderDetail(orderId)).unwrap();
      }
    } catch (error) {
      await popupAlert(error || "Khong cap nhat duoc trang thai van chuyen.");
    }
  }

  return {
    orders: filteredOrders,
    filters,
    selectedOrderId,
    selectedOrderSummary,
    selectedOrder: currentOrder,
    orderTypeOptions,
    typeFilter,
    pageInfo: {
      page: admin.orders.page,
      totalPages: admin.orders.totalPages,
    },
    ui: {
      error: admin.orders.error ?? admin.currentOrder.error ?? (!auth.accessToken && auth.isReady ? "Khong co access token." : null),
      isLoading: admin.orders.status === "loading",
      detailLoading: admin.currentOrder.status === "loading" && Boolean(selectedOrderId),
    },
    actions: {
      setFilter,
      setTypeFilter,
      retry: async () => {
        await refreshOrders();
        if (selectedOrderId) {
          await dispatch(fetchAdminOrderDetail(selectedOrderId));
        }
      },
      selectOrder: (orderId) => setSelectedOrderId(orderId),
      clearSelectedOrder: () => {
        setSelectedOrderId(null);
        dispatch(clearAdminCurrentOrder());
      },
      goToDetail: (orderId) => navigate(`${orderBasePath}/${orderId}`),
      updateOrderStatus,
      updateShippingStatus,
    },
    popupElement,
  };
}
