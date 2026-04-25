import { useEffect, useMemo, useState } from "react";
import { getOrderById } from "@/services/adminService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  clearStaffPrescriptionDetail,
  fetchStaffPrescriptionDetail,
  fetchStaffPrescriptions,
  patchStaffPrescriptionReview,
  selectStaffPrescriptionState,
} from "@/store/prescription/prescriptionSlice";

const DEFAULT_FILTER_STATUS = "";

export function useStaffPrescriptionReview() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const prescriptionState = useAppSelector(selectStaffPrescriptionState);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState(DEFAULT_FILTER_STATUS);
  const [actionNote, setActionNote] = useState("");
  const [relatedOrder, setRelatedOrder] = useState(null);
  const [relatedOrderStatus, setRelatedOrderStatus] = useState("idle");
  const [relatedOrderError, setRelatedOrderError] = useState("");

  useEffect(() => {
    if (!auth.accessToken) {
      return;
    }

    void loadList();
  }, [auth.accessToken, filterStatus]);

  useEffect(() => {
    if (!auth.accessToken || !selectedId) {
      dispatch(clearStaffPrescriptionDetail());
      setRelatedOrder(null);
      setRelatedOrderStatus("idle");
      setRelatedOrderError("");
      return;
    }

    void dispatch(fetchStaffPrescriptionDetail(selectedId));
  }, [auth.accessToken, dispatch, selectedId]);

  useEffect(() => {
    const orderId = Number(prescriptionState.detail.data?.orderId ?? 0);

    if (!auth.accessToken || !orderId) {
      setRelatedOrder(null);
      setRelatedOrderStatus("idle");
      setRelatedOrderError("");
      return;
    }

    let ignore = false;

    async function loadRelatedOrder() {
      setRelatedOrderStatus("loading");
      setRelatedOrderError("");

      try {
        const order = await getOrderById(orderId, auth.accessToken);

        if (ignore) {
          return;
        }

        setRelatedOrder(order ?? null);
        setRelatedOrderStatus("succeeded");
      } catch (error) {
        if (ignore) {
          return;
        }

        setRelatedOrder(null);
        setRelatedOrderStatus("failed");
        setRelatedOrderError(
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Không tải được đơn hàng liên quan.",
        );
      }
    }

    void loadRelatedOrder();

    return () => {
      ignore = true;
    };
  }, [auth.accessToken, prescriptionState.detail.data?.orderId]);

  useEffect(() => {
    const detail = prescriptionState.detail.data;

    if (detail?.prescriptionId === selectedId) {
      setActionNote(detail.notes || "");
    }
  }, [prescriptionState.detail.data, selectedId]);

  useEffect(() => {
    const items = prescriptionState.list.items;

    if (prescriptionState.list.status !== "succeeded") {
      return;
    }

    if (!selectedId && items[0]?.prescriptionId) {
      setSelectedId(items[0].prescriptionId);
      return;
    }

    if (selectedId && !items.some((item) => item.prescriptionId === selectedId)) {
      setSelectedId(items[0]?.prescriptionId ?? null);
    }
  }, [prescriptionState.list.items, prescriptionState.list.status, selectedId]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const items = prescriptionState.list.items;

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      String(item.orderId || "").includes(normalizedQuery)
      || String(item.prescriptionId || "").includes(normalizedQuery)
      || String(item.customerName || "").toLowerCase().includes(normalizedQuery)
      || String(item.customerEmail || "").toLowerCase().includes(normalizedQuery));
  }, [prescriptionState.list.items, searchQuery]);

  const pendingCount = useMemo(
    () => prescriptionState.list.items.filter((item) => ["submitted", "reviewing"].includes(normalizeStatus(item.prescriptionStatus))).length,
    [prescriptionState.list.items],
  );

  async function loadList() {
    return dispatch(fetchStaffPrescriptions({
      page: 1,
      pageSize: 50,
      prescriptionStatus: filterStatus,
      sortBy: "createdAt",
      sortOrder: "desc",
    }));
  }

  function updateFilterStatus(nextStatus) {
    setFilterStatus(nextStatus);
    setSelectedId(null);
    dispatch(clearStaffPrescriptionDetail());
  }

  async function review(nextStatus) {
    const detail = prescriptionState.detail.data;

    if (!detail) {
      return;
    }

    try {
      await dispatch(patchStaffPrescriptionReview({
        prescriptionId: detail.prescriptionId,
        payload: {
          prescriptionStatus: nextStatus,
          notes: normalizeOptional(actionNote),
        },
      })).unwrap();

      await refreshAfterAction(detail.prescriptionId, Number(detail.orderId ?? 0));
    } catch {
      // The slice already stores the API error for the page to render.
    }
  }

  async function refreshAfterAction(prescriptionId, orderId) {
    await loadList();
    await Promise.all([
      dispatch(fetchStaffPrescriptionDetail(prescriptionId)),
      orderId > 0 && auth.accessToken
        ? getOrderById(orderId, auth.accessToken)
            .then((order) => {
              setRelatedOrder(order ?? null);
              setRelatedOrderStatus("succeeded");
              setRelatedOrderError("");
            })
            .catch((error) => {
              setRelatedOrder(null);
              setRelatedOrderStatus("failed");
              setRelatedOrderError(
                error instanceof Error && error.message.trim().length > 0
                  ? error.message
                  : "Không tải được đơn hàng liên quan.",
              );
            })
        : Promise.resolve(),
    ]);
  }

  return {
    items: filteredItems,
    selectedId,
    detail: prescriptionState.detail.data,
    relatedOrder,
    searchQuery,
    filterStatus,
    actionNote,
    pendingCount,
    ui: {
      isListLoading: prescriptionState.list.status === "loading",
      isDetailLoading: prescriptionState.detail.status === "loading",
      isSaving: prescriptionState.action.status === "loading",
      isRelatedOrderLoading: relatedOrderStatus === "loading",
      listError: prescriptionState.list.error,
      relatedOrderError,
      actionError: prescriptionState.action.error || prescriptionState.detail.error,
    },
    actions: {
      loadList,
      setSelectedId,
      setSearchQuery,
      setFilterStatus: updateFilterStatus,
      setActionNote,
      review,
    },
  };
}

function normalizeStatus(status) {
  return String(status ?? "").trim().toLowerCase();
}

function normalizeOptional(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}
