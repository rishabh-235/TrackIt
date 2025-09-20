import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { clearCredentials } from "../slices/authSlice.js";

// Base query with automatic token refresh
const baseQueryWithReauth = async (args, api, extraOptions) => {
  // Base query configuration
  const baseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:5000/api",
    credentials: "include", // Include httpOnly cookies in requests
    prepareHeaders: (headers) => {
      // No need to manually set authorization header since httpOnly cookies are sent automatically
      headers.set("content-type", "application/json");
      return headers;
    },
  });

  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401 (Unauthorized), try to refresh the token
  if (result?.error?.status === 401) {
    // Try to refresh the token
    const refreshResult = await baseQuery(
      {
        url: "/auth/refresh-token",
        method: "POST",
      },
      api,
      extraOptions
    );

    if (refreshResult?.data?.success) {
      // Retry the original query - new tokens should be in cookies now
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Refresh failed, clear credentials
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

// Base API configuration
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Auth", "User", "Project", "Task", "Dashboard", "Analytics"],
  endpoints: () => ({}),
});

export default baseApi;
