import baseApi from "./baseApi";

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all projects with filtering and pagination
    getProjects: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });

        return `/projects?${searchParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Project", id: _id })),
              { type: "Project", id: "LIST" },
            ]
          : [{ type: "Project", id: "LIST" }],
    }),

    // Get project by ID
    getProjectById: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),

    // Create project
    createProject: builder.mutation({
      query: (projectData) => ({
        url: "/projects",
        method: "POST",
        body: projectData,
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    // Update project
    updateProject: builder.mutation({
      query: ({ id, ...projectData }) => ({
        url: `/projects/${id}`,
        method: "PUT",
        body: projectData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
        { type: "Task", id: "LIST" }, // Tasks might be affected
      ],
    }),

    // Delete project
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Project", id },
        { type: "Project", id: "LIST" },
        { type: "Task", id: "LIST" }, // Related tasks will be affected
      ],
    }),

    // Add team member to project
    addTeamMember: builder.mutation({
      query: ({ projectId, userId }) => ({
        url: `/projects/${projectId}/team`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
      ],
    }),

    // Remove team member from project
    removeTeamMember: builder.mutation({
      query: ({ projectId, userId }) => ({
        url: `/projects/${projectId}/team/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
      ],
    }),

    // Get project statistics
    getProjectStats: builder.query({
      query: () => "/projects/stats",
      providesTags: [{ type: "Project", id: "STATS" }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useGetProjectStatsQuery,
} = projectApi;
