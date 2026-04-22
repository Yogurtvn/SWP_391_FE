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

export const ADMIN_ORDER_TYPES = [
  { value: "ready", label: "Đơn thường" },
  { value: "preOrder", label: "Pre-order" },
  { value: "prescription", label: "Đơn kính" },
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
        orderType: typeFilter === "all" ? undefined : typeFilter,
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
  }, [auth.accessToken, auth.isReady, filters.page, filters.pageSize, filters.search, filters.orderStatus, filters.shippingStatus, typeFilter]);

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

  const filteredOrders = admin.orders.items;
  const orderTypeOptions = ADMIN_ORDER_TYPES;

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

  function setOrderTypeFilter(value) {
    setTypeFilter(value);
    setFilters((current) => ({
      ...current,
      page: 1,
    }));
  }

  async function updateOrderStatus(orderId) {
    const formValues = await popupForm({
      title: "Đổi trạng thái đơn",
      message: "Chọn trạng thái hợp lệ và thêm ghi chú nếu cần.",
      okText: "Cập nhật",
      fields: [
        {
          name: "orderStatus",
          label: "Trạng thái đơn",
          type: "select",
          required: true,
          options: ADMIN_ORDER_STATUSES.map((status) => ({ value: status, label: status })),
        },
        {
          name: "note",
          label: "Ghi chú",
          type: "textarea",
          placeholder: "Thêm ghi chú cho lịch sử cập nhật...",
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
      await popupAlert(error || "Không cập nhật được trạng thái đơn.");
    }
  }

  async function updateShippingStatus(orderId) {
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
          options: ADMIN_SHIPPING_STATUSES.map((status) => ({ value: status, label: status })),
        },
        {
          name: "note",
          label: "Ghi chú",
          type: "textarea",
          placeholder: "Thêm ghi chú giao hàng...",
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
      await popupAlert(error || "Không cập nhật được trạng thái vận chuyển.");
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
      error: admin.orders.error ?? admin.currentOrder.error ?? (!auth.accessToken && auth.isReady ? "Không có access token." : null),
      isLoading: admin.orders.status === "loading",
      detailLoading: admin.currentOrder.status === "loading" && Boolean(selectedOrderId),
    },
    actions: {
      setFilter,
      setTypeFilter: setOrderTypeFilter,
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
