import baseApi from "./baseApi";

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all tasks with filtering and pagination
    getTasks: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });

        return `/tasks?${searchParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Task", id: _id })),
              { type: "Task", id: "LIST" },
            ]
          : [{ type: "Task", id: "LIST" }],
    }),

    // Get task by ID
    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: "Task", id }],
    }),

    // Create task
    createTask: builder.mutation({
      query: (taskData) => ({
        url: "/tasks",
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: [
        { type: "Task", id: "LIST" },
        { type: "Project", id: "LIST" }, // Project stats might change
      ],
    }),

    // Update task
    updateTask: builder.mutation({
      query: ({ id, ...taskData }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        body: taskData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        { type: "Project", id: "LIST" }, // Project stats might change
      ],
    }),

    // Delete task
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        { type: "Project", id: "LIST" }, // Project stats might change
      ],
    }),

    // Add comment to task
    addTaskComment: builder.mutation({
      query: ({ taskId, content }) => ({
        url: `/tasks/${taskId}/comments`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),

    // Add attachment to task
    addTaskAttachment: builder.mutation({
      query: ({ taskId, attachment }) => ({
        url: `/tasks/${taskId}/attachments`,
        method: "POST",
        body: { attachment },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),

    // Update task status
    updateTaskStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        { type: "Project", id: "LIST" },
      ],
    }),

    // Get task statistics
    getTaskStats: builder.query({
      query: () => "/tasks/stats",
      providesTags: [{ type: "Task", id: "STATS" }],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useAddTaskCommentMutation,
  useAddTaskAttachmentMutation,
  useUpdateTaskStatusMutation,
  useGetTaskStatsQuery,
} = taskApi;
