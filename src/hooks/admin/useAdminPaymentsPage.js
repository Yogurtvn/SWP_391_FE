import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePopupDialog } from "@/components/common/ui/usePopupDialog";
import {
  getPaymentById,
  getPaymentHistories,
  getPayments,
  updatePaymentStatus,
} from "@/services/paymentService";
import { selectAuthState } from "@/store/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

function normalizeApiError(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}

export function useAdminPaymentsPage() {
  const auth = useAppSelector(selectAuthState);
  const navigate = useNavigate();
  const location = useLocation();
  const { popupAlert, popupForm, popupElement } = usePopupDialog();

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    paymentMethod: "",
    paymentStatus: "",
    orderId: "",
  });
  const [payments, setPayments] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    totalPages: 0,
    totalItems: 0,
  });
  const [listStatus, setListStatus] = useState("idle");
  const [listError, setListError] = useState("");

  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [paymentDetail, setPaymentDetail] = useState(null);
  const [paymentHistories, setPaymentHistories] = useState([]);
  const [detailStatus, setDetailStatus] = useState("idle");
  const [detailError, setDetailError] = useState("");

  const orderBasePath = location.pathname.startsWith("/staff") ? "/staff/orders" : "/admin/orders";

  const selectedPayment = useMemo(
    () => payments.find((item) => item.paymentId === selectedPaymentId) ?? null,
    [payments, selectedPaymentId],
  );

  const refreshList = useCallback(async () => {
    if (!auth.accessToken) {
      return;
    }

    setListStatus("loading");
    setListError("");

    try {
      const response = await getPayments(auth.accessToken, {
        page: filters.page,
        pageSize: filters.pageSize,
        paymentMethod: filters.paymentMethod || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        orderId: filters.orderId.trim() || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const nextItems = Array.isArray(response?.items) ? response.items : [];
      setPayments(nextItems);
      setPageInfo({
        page: Number(response?.page ?? filters.page),
        totalPages: Number(response?.totalPages ?? 0),
        totalItems: Number(response?.totalItems ?? 0),
      });
      setListStatus("succeeded");
      setListError("");
    } catch (error) {
      setPayments([]);
      setPageInfo({
        page: 1,
        totalPages: 0,
        totalItems: 0,
      });
      setListStatus("failed");
      setListError(normalizeApiError(error, "Không tải được danh sách thanh toán."));
    }
  }, [auth.accessToken, filters.orderId, filters.page, filters.pageSize, filters.paymentMethod, filters.paymentStatus]);

  const refreshDetail = useCallback(async (paymentId) => {
    if (!auth.accessToken || !paymentId) {
      return;
    }

    setDetailStatus("loading");
    setDetailError("");

    try {
      const [detailResponse, historyResponse] = await Promise.all([
        getPaymentById(auth.accessToken, paymentId),
        getPaymentHistories(auth.accessToken, paymentId),
      ]);

      setPaymentDetail(detailResponse ?? null);
      setPaymentHistories(Array.isArray(historyResponse?.items) ? historyResponse.items : []);
      setDetailStatus("succeeded");
      setDetailError("");
    } catch (error) {
      setPaymentDetail(null);
      setPaymentHistories([]);
      setDetailStatus("failed");
      setDetailError(normalizeApiError(error, "Không tải được chi tiết thanh toán."));
    }
  }, [auth.accessToken]);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void refreshList();
  }, [auth.accessToken, auth.isReady, refreshList]);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    if (selectedPaymentId) {
      void refreshDetail(selectedPaymentId);
      return;
    }

    if (payments.length > 0) {
      setSelectedPaymentId(payments[0].paymentId);
    }
  }, [auth.accessToken, auth.isReady, payments, refreshDetail, selectedPaymentId]);

  async function openUpdatePaymentStatus(paymentId) {
    if (!auth.accessToken) {
      await popupAlert("Không có access token.");
      return;
    }

    const workingPayment = paymentId === paymentDetail?.paymentId
      ? paymentDetail
      : selectedPayment;
    const currentStatus = String(workingPayment?.paymentStatus ?? "").trim().toLowerCase();
    const availableStatuses = ["pending", "completed", "failed"].filter((status) => status !== currentStatus);

    if (availableStatuses.length === 0) {
      await popupAlert("Payment hiện không có trạng thái mới để cập nhật.");
      return;
    }

    const formValues = await popupForm({
      title: "Cập nhật trạng thái thanh toán",
      message: `Payment #${paymentId}`,
      okText: "Cập nhật",
      fields: [
        {
          name: "paymentStatus",
          label: "Trạng thái",
          type: "select",
          required: true,
          options: availableStatuses.map((status) => ({
            value: status,
            label: status,
          })),
        },
        {
          name: "transactionCode",
          label: "Mã giao dịch",
          type: "text",
          placeholder: "Mã giao dịch (optional)",
        },
        {
          name: "notes",
          label: "Ghi chú",
          type: "textarea",
          placeholder: "Ghi chú cập nhật trạng thái...",
        },
      ],
      initialValues: {
        paymentStatus: availableStatuses[0],
        transactionCode: "",
        notes: "",
      },
    });

    if (!formValues) {
      return;
    }

    try {
      await updatePaymentStatus(auth.accessToken, paymentId, {
        paymentStatus: formValues.paymentStatus,
        transactionCode: formValues.transactionCode?.trim() || undefined,
        notes: formValues.notes?.trim() || undefined,
      });

      await Promise.all([
        refreshList(),
        refreshDetail(paymentId),
      ]);
    } catch (error) {
      await popupAlert(normalizeApiError(error, "Không cập nhật được trạng thái thanh toán."));
    }
  }

  function setFilter(field, value) {
    setFilters((current) => ({
      ...current,
      page: field === "page" ? Number(value) : 1,
      [field]: value,
    }));
  }

  return {
    filters,
    payments,
    pageInfo,
    selectedPaymentId,
    paymentDetail,
    paymentHistories,
    ui: {
      listLoading: listStatus === "loading",
      detailLoading: detailStatus === "loading",
      listError: !auth.accessToken && auth.isReady ? "Không có access token." : listError,
      detailError,
    },
    actions: {
      setFilter,
      retryList: refreshList,
      selectPayment: setSelectedPaymentId,
      refreshDetail: () => selectedPaymentId && refreshDetail(selectedPaymentId),
      updatePaymentStatus: openUpdatePaymentStatus,
      goToOrder: (orderId) => navigate(`${orderBasePath}/${orderId}`),
    },
    popupElement,
  };
}
