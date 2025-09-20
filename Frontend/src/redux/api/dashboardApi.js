import baseApi from "./baseApi";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get project analytics
    getProjectAnalytics: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });

        return `/dashboard/project-analytics?${searchParams.toString()}`;
      },
      providesTags: [{ type: "Analytics", id: "PROJECT" }],
    }),

    // Get task analytics
    getTaskAnalytics: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });

        return `/dashboard/task-analytics?${searchParams.toString()}`;
      },
      providesTags: [{ type: "Analytics", id: "TASK" }],
    }),

    // Get team performance
    getTeamPerformance: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });

        return `/dashboard/team-performance?${searchParams.toString()}`;
      },
      providesTags: [{ type: "Analytics", id: "TEAM" }],
    }),

    // Get dashboard statistics (combined overview)
    getDashboardStats: builder.query({
      query: () => "/dashboard/",
      providesTags: [{ type: "Analytics", id: "STATS" }],
    }),

    // Get overview statistics
    getOverviewStats: builder.query({
      query: () => "/dashboard/overview",
      providesTags: [{ type: "Analytics", id: "OVERVIEW" }],
    }),

    // Get recent activities
    getRecentActivities: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });

        return `/dashboard/recent-activities?${searchParams.toString()}`;
      },
      providesTags: [{ type: "Analytics", id: "ACTIVITIES" }],
    }),

    // Get workload distribution
    getWorkloadDistribution: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, value);
          }
        });

        return `/dashboard/workload-distribution?${searchParams.toString()}`;
      },
      providesTags: [{ type: "Analytics", id: "WORKLOAD" }],
    }),

    // Get deadline alerts
    getDeadlineAlerts: builder.query({
      query: () => "/dashboard/deadline-alerts",
      providesTags: [{ type: "Analytics", id: "DEADLINES" }],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetProjectAnalyticsQuery,
  useGetTaskAnalyticsQuery,
  useGetTeamPerformanceQuery,
  useGetOverviewStatsQuery,
  useGetRecentActivitiesQuery,
  useGetWorkloadDistributionQuery,
  useGetDeadlineAlertsQuery,
} = dashboardApi;
