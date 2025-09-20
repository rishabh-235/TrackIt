import baseApi from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get managers and admins (accessible to all authenticated users)
    getManagers: builder.query({
      query: () => "/users/managers",
      providesTags: [{ type: "User", id: "MANAGERS" }],
    }),

    // Get all users with filtering and pagination
    getUsers: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });

        return `/users?${searchParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "User", id: _id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    // Get user by ID
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    // Update user
    updateUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `/users/${id}`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // Update user role
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/users/${id}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // Deactivate user
    deactivateUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/deactivate`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // Activate user
    activateUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/activate`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // Delete user
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // Get user statistics
    getUserStats: builder.query({
      query: () => "/users/stats",
      providesTags: [{ type: "User", id: "STATS" }],
    }),
  }),
});

export const {
  useGetManagersQuery,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useUpdateUserRoleMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useDeleteUserMutation,
  useGetUserStatsQuery,
} = userApi;
