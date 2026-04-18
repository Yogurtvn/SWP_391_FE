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

const DEFAULT_ORDER_FILTERS = {
  orderType: "ready",
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
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!auth.isReady || !auth.accessToken) {
      return;
    }

    if (profileState.status === "idle") {
      void dispatch(fetchMyProfile());
    }

    if (orderState.listStatus === "idle") {
      void dispatch(fetchOrderList(DEFAULT_ORDER_FILTERS));
    }
  }, [
    auth.accessToken,
    auth.isReady,
    dispatch,
    orderState.listStatus,
    profileState.status,
  ]);

  useEffect(() => {
    if (!profileState.profile) {
      return;
    }

    setAccountForm({
      firstName: profileState.profile.firstName,
      lastName: profileState.profile.lastName,
      email: profileState.profile.email,
      phone: profileState.profile.phone,
    });
  }, [profileState.profile]);

  const recentOrders = useMemo(() => orderState.items.slice(0, 3), [orderState.items]);

  async function saveAccount() {
    await dispatch(saveMyProfile(accountForm)).unwrap();
  }

  return {
    activeTab,
    profile: profileState.profile,
    accountForm,
    recentOrders,
    ui: {
      profileLoading: profileState.status === "loading",
      ordersLoading: orderState.listStatus === "loading",
      profileError: profileState.error,
      ordersError: orderState.listError,
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
    },
  };
}
