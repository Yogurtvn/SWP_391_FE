import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuthState } from "@/store/auth/authSlice";
import {
  clearOrderList,
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

export function useOrdersPage() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuthState);
  const order = useAppSelector(selectOrderState);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!auth.isReady) {
      return;
    }

    if (!auth.accessToken) {
      dispatch(clearOrderList());
      return;
    }

    void dispatch(fetchOrderList(DEFAULT_ORDER_FILTERS));
  }, [auth.accessToken, auth.isReady, dispatch]);

  const filteredOrders = useMemo(() => {
    return order.items.filter((item) => {
      if (filterStatus !== "all" && item.statusKey !== filterStatus) {
        return false;
      }

      if (!searchQuery.trim()) {
        return true;
      }

      return String(item.orderId).includes(searchQuery.trim());
    });
  }, [filterStatus, order.items, searchQuery]);

  return {
    isAuthenticated: Boolean(auth.accessToken),
    orders: filteredOrders,
    pageInfo: {
      totalItems: order.totalItems,
      totalPages: order.totalPages,
    },
    filters: {
      searchQuery,
      filterStatus,
    },
    ui: {
      isLoading: order.listStatus === "loading",
      error: order.listError,
      isEmpty: order.listStatus === "succeeded" && filteredOrders.length === 0,
    },
    actions: {
      setSearchQuery,
      setFilterStatus,
      retry: () => {
        void dispatch(fetchOrderList(DEFAULT_ORDER_FILTERS));
      },
    },
  };
}
