import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import baseApi from "./api/baseApi";
import authSlice from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    // API slice
    [baseApi.reducerPath]: baseApi.reducer,

    // Regular slices
    auth: authSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [baseApi.util.resetApiState.type],
      },
    }).concat(baseApi.middleware),
});

// Enable listener behavior for the store
setupListeners(store.dispatch);

export default store;
