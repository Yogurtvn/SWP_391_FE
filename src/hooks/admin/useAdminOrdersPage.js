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
import { getOrderStatusPresentation, getShippingStatusPresentation } from "@/utils/orderStatus";
import { getAllowedAdminOrderTransitions, getAllowedShippingStatuses } from "@/utils/orderWorkflowPolicy";

export const ADMIN_ORDER_TYPES = [
  { value: "ready", label: "Đơn thường" },
  { value: "preOrder", label: "Pre-order" },
  { value: "prescription", label: "Đơn kính" },
];

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
    let workingOrder =
      String(currentOrder?.orderId ?? "") === String(orderId)
        ? currentOrder
        : selectedOrderSummary;

    try {
      workingOrder = await dispatch(fetchAdminOrderDetail(orderId)).unwrap();
    } catch {
      // Fallback to summary data when detail fetch fails.
    }

    const availableOrderStatuses = getAllowedAdminOrderTransitions(workingOrder);

    if (availableOrderStatuses.length === 0) {
      await popupAlert("Đơn hàng hiện không có transition trạng thái hợp lệ.");
      return;
    }

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
          options: availableOrderStatuses.map((status) => {
            const presentation = getOrderStatusPresentation(status);
            return { value: status, label: presentation.label, className: presentation.className };
          }),
        },
        {
          name: "note",
          label: "Ghi chú",
          type: "textarea",
          placeholder: "Thêm ghi chú cho lịch sử cập nhật...",
        },
      ],
      initialValues: {
        orderStatus: availableOrderStatuses.includes(workingOrder?.orderStatus)
          ? workingOrder.orderStatus
          : availableOrderStatuses[0],
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
            note: formValues.note?.trim() || undefined,
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
    let workingOrder =
      String(currentOrder?.orderId ?? "") === String(orderId)
        ? currentOrder
        : selectedOrderSummary;

    try {
      workingOrder = await dispatch(fetchAdminOrderDetail(orderId)).unwrap();
    } catch {
      // Fallback to summary data when detail fetch fails.
    }

    const availableShippingStatuses = getAllowedShippingStatuses(workingOrder);

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
        shippingStatus: availableShippingStatuses.includes(workingOrder?.shippingStatus)
          ? workingOrder.shippingStatus
          : availableShippingStatuses[0],
        shippingCode: workingOrder?.shippingCode ?? "",
        expectedDeliveryDate: workingOrder?.expectedDeliveryDate
          ? new Date(workingOrder.expectedDeliveryDate).toISOString().slice(0, 16)
          : "",
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
            shippingCode: formValues.shippingCode?.trim() || undefined,
            expectedDeliveryDate: formValues.expectedDeliveryDate
              ? new Date(formValues.expectedDeliveryDate).toISOString()
              : undefined,
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
