import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/auth/authSlice";
import cartReducer from "@/store/cart/cartSlice";
import catalogReducer from "@/store/catalog/catalogSlice";
import orderReducer from "@/store/order/orderSlice";
import profileReducer from "@/store/profile/profileSlice";
import { persistStoredAuth } from "@/store/auth/authStorage";
import { persistStoredCartViewCache } from "@/store/cart/cartStorage";

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    catalog: catalogReducer,
    order: orderReducer,
    profile: profileReducer,
  },
});

store.subscribe(() => {
  const { auth, cart } = store.getState();

  persistStoredAuth({
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user,
  });

  persistStoredCartViewCache(cart.viewCache);
});

export {
  store,
};
