import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  clearStaffPrescriptionDetail,
  fetchStaffPrescriptionDetail,
  fetchStaffPrescriptions,
  patchStaffPrescriptionMoreInfo,
  patchStaffPrescriptionReview,
  selectStaffPrescriptionState,
} from "@/store/prescription/prescriptionSlice";

const DEFAULT_FILTER_STATUS = "submitted";

export function useStaffPrescriptionReview() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const prescriptionState = useAppSelector(selectStaffPrescriptionState);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState(DEFAULT_FILTER_STATUS);
  const [actionNote, setActionNote] = useState("");
  const [localActionError, setLocalActionError] = useState("");

  useEffect(() => {
    if (!auth.accessToken) {
      return;
    }

    void loadList();
  }, [auth.accessToken, filterStatus]);

  useEffect(() => {
    if (!auth.accessToken || !selectedId) {
      dispatch(clearStaffPrescriptionDetail());
      return;
    }

    void dispatch(fetchStaffPrescriptionDetail(selectedId));
  }, [auth.accessToken, dispatch, selectedId]);

  useEffect(() => {
    const detail = prescriptionState.detail.data;

    if (detail?.prescriptionId === selectedId) {
      setActionNote(detail.notes || "");
      setLocalActionError("");
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
      String(item.orderId || "").includes(normalizedQuery) ||
      String(item.prescriptionId || "").includes(normalizedQuery) ||
      String(item.customerName || "").toLowerCase().includes(normalizedQuery) ||
      String(item.customerEmail || "").toLowerCase().includes(normalizedQuery),
    );
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

    setLocalActionError("");

    try {
      await dispatch(patchStaffPrescriptionReview({
        prescriptionId: detail.prescriptionId,
        payload: {
          prescriptionStatus: nextStatus,
          notes: normalizeOptional(actionNote),
        },
      })).unwrap();

      await refreshAfterAction(detail.prescriptionId);
    } catch {
      // The slice already stores the API error for the page to render.
    }
  }

  async function requestMoreInfo() {
    const detail = prescriptionState.detail.data;

    if (!detail) {
      return;
    }

    if (!actionNote.trim()) {
      setLocalActionError("Vui lòng nhập ghi chú cho khách hàng.");
      return;
    }

    setLocalActionError("");

    try {
      await dispatch(patchStaffPrescriptionMoreInfo({
        prescriptionId: detail.prescriptionId,
        payload: { notes: actionNote.trim() },
      })).unwrap();

      await refreshAfterAction(detail.prescriptionId);
    } catch {
      // The slice already stores the API error for the page to render.
    }
  }

  async function refreshAfterAction(prescriptionId) {
    await loadList();
    await dispatch(fetchStaffPrescriptionDetail(prescriptionId));
  }

  return {
    items: filteredItems,
    selectedId,
    detail: prescriptionState.detail.data,
    searchQuery,
    filterStatus,
    actionNote,
    pendingCount,
    ui: {
      isListLoading: prescriptionState.list.status === "loading",
      isDetailLoading: prescriptionState.detail.status === "loading",
      isSaving: prescriptionState.action.status === "loading",
      listError: prescriptionState.list.error,
      actionError: localActionError || prescriptionState.action.error || prescriptionState.detail.error,
    },
    actions: {
      loadList,
      setSelectedId,
      setSearchQuery,
      setFilterStatus: updateFilterStatus,
      setActionNote,
      review,
      requestMoreInfo,
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
