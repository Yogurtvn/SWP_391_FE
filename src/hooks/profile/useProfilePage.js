import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  fetchMyProfile,
  saveMyProfile,
  selectProfileState,
} from "@/store/profile/profileSlice";
import {
  fetchOrderList,
  selectOrderState,
} from "@/store/order/orderSlice";
import { getPrescriptions } from "@/services/prescriptionService";

const DEFAULT_ORDER_FILTERS = {
  page: 1,
  pageSize: 50,
  sortBy: "createdAt",
  sortOrder: "desc",
};

export function useProfilePage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const profileState = useAppSelector(selectProfileState);
  const orderState = useAppSelector(selectOrderState);

  const [activeTab, setActiveTab] = useState("orders");
  const [accountForm, setAccountForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [prescriptionState, setPrescriptionState] = useState({
    items: [],
    status: "idle",
    error: "",
  });

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    if (profileState.status === "idle") {
      void dispatch(fetchMyProfile());
    }
  }, [
    auth.accessToken,
    auth.isReady,
    dispatch,
    profileState.status,
  ]);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    void dispatch(fetchOrderList(DEFAULT_ORDER_FILTERS));
  }, [auth.accessToken, auth.isReady, dispatch]);

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken || prescriptionState.status !== "idle") {
      return;
    }

    let isMounted = true;

    async function loadPrescriptions() {
      setPrescriptionState((current) => ({
        ...current,
        status: "loading",
        error: "",
      }));

      try {
        const response = await getPrescriptions(
          {
            page: 1,
            pageSize: 50,
            sortBy: "createdAt",
            sortOrder: "desc",
          },
          auth.accessToken,
        );

        if (!isMounted) {
          return;
        }

        setPrescriptionState({
          items: Array.isArray(response?.items) ? response.items : [],
          status: "succeeded",
          error: "",
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setPrescriptionState({
          items: [],
          status: "failed",
          error: getProfileLoadError(error, "Không thể tải danh sách đơn kính."),
        });
      }
    }

    void loadPrescriptions();

    return () => {
      isMounted = false;
    };
  }, [auth.accessToken, auth.isReady, prescriptionState.status]);

  useEffect(() => {
    if (!profileState.profile) {
      return;
    }

    setAccountForm({
      fullName: profileState.profile.fullName,
      email: profileState.profile.email,
      phone: profileState.profile.phone,
    });
  }, [profileState.profile]);

  useEffect(() => {
    if (profileState.profile || !auth.user) {
      return;
    }

    setAccountForm({
      fullName: auth.user.fullName ?? "",
      email: auth.user.email ?? "",
      phone: auth.user.phone ?? "",
    });
  }, [auth.user, profileState.profile]);

  const recentOrders = useMemo(() => orderState.items.slice(0, 3), [orderState.items]);
  const preOrders = useMemo(
    () =>
      orderState.items
        .filter((order) => normalizeOrderType(order.orderType) === "preorder")
        .slice(0, 3),
    [orderState.items],
  );
  const derivedPrescriptions = useMemo(() => derivePrescriptionsFromOrders(orderState.items), [orderState.items]);
  const prescriptions = prescriptionState.items.length > 0 ? prescriptionState.items.slice(0, 3) : derivedPrescriptions.slice(0, 3);

  async function saveAccount() {
    await dispatch(saveMyProfile(accountForm)).unwrap();
  }

  return {
    activeTab,
    profile: profileState.profile,
    accountForm,
    recentOrders,
    preOrders,
    prescriptions,
    ui: {
      profileLoading: profileState.status === "loading",
      ordersLoading: orderState.listStatus === "loading",
      preOrdersLoading: orderState.listStatus === "loading",
      prescriptionsLoading: prescriptionState.status === "loading" && derivedPrescriptions.length === 0,
      profileError: profileState.error,
      ordersError: orderState.listError,
      preOrdersError: orderState.listError,
      prescriptionsError: prescriptionState.status === "failed" && derivedPrescriptions.length === 0
        ? prescriptionState.error
        : "",
      saveStatus: profileState.mutationStatus,
      saveError: profileState.mutationError,
    },
    actions: {
      setActiveTab,
      setAccountField: (field, value) => {
        setAccountForm((current) => ({
          ...current,
          [field]: value,
        }));
      },
      saveAccount,
      retryProfile: () => {
        void dispatch(fetchMyProfile());
      },
      retryOrders: () => {
        void dispatch(fetchOrderList(DEFAULT_ORDER_FILTERS));
      },
      retryPrescriptions: () => {
        setPrescriptionState((current) => ({
          ...current,
          status: "idle",
          error: "",
        }));
      },
    },
  };
}

function normalizeOrderType(orderType) {
  return String(orderType ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function derivePrescriptionsFromOrders(orders) {
  return (Array.isArray(orders) ? orders : [])
    .flatMap((order) => {
      const items = Array.isArray(order?.detail?.items) ? order.detail.items : [];

      return items
        .filter((item) => item?.prescription)
        .map((item) => ({
          prescriptionId: Number(item.prescription.prescriptionId ?? item.prescriptionId ?? 0),
          orderId: Number(order.orderId ?? 0),
          lensTypeCode: item.prescription.lensTypeCode || `Lens #${item.prescription.lensTypeId ?? ""}`,
          prescriptionStatus: item.prescription.prescriptionStatus || "",
          prescriptionStatusLabel: item.prescription.prescriptionStatusLabel || "Đang cập nhật",
          totalLensPrice: Number(item.prescription.totalLensPrice ?? item.lensPrice ?? 0),
          createdAtLabel: order.createdAtLabel,
        }));
    })
    .filter((item) => item.prescriptionId > 0);
}

function getProfileLoadError(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}
