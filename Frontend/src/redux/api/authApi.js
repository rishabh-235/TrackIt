import baseApi from "./baseApi";
import { setCredentials, clearCredentials } from "../slices/authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Login mutation
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success) {
            dispatch(
              setCredentials({
                accessToken: "authenticated", // We don't need the actual token since it's in httpOnly cookies
                user: data.data.user,
              })
            );
          }
        } catch (error) {
          // Error handling will be done in components
        }
      },
      invalidatesTags: ["Auth"],
    }),

    // Register mutation
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success) {
            dispatch(
              setCredentials({
                accessToken: "authenticated", // We don't need the actual token since it's in httpOnly cookies
                user: data.data.user,
              })
            );
          }
        } catch (error) {
          // Error handling will be done in components
        }
      },
      invalidatesTags: ["Auth"],
    }),

    // Get current user profile
    getProfile: builder.query({
      query: () => "/auth/profile",
      providesTags: ["Auth"],
    }),

    // Refresh token
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh-token",
        method: "POST",
      }),
    }),

    // Update profile
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: "/auth/profile",
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Change password
    changePassword: builder.mutation({
      query: (passwordData) => ({
        url: "/auth/change-password",
        method: "PUT",
        body: passwordData,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Logout
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          // Even if logout fails on backend, clear local credentials
          console.error("Logout error:", error);
        } finally {
          dispatch(clearCredentials());
          dispatch(baseApi.util.resetApiState());
        }
      },
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useRefreshTokenMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useLogoutMutation,
} = authApi;
