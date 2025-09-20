import { User, Project, Task } from "../models/index.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/helpers.js";

// @desc    Get comprehensive dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  // Get project statistics
  const projectStats = await getProjectStatistics(userRole, userId);
  const projectData = projectStats[0] || {};

  // Get task statistics
  const taskStats = await getTaskStatistics(userRole, userId);
  const taskData = taskStats[0] || {};

  // Get recent activities
  const recentActivities = await getRecentActivities(userRole, userId);

  // Get recent projects
  const recentProjects = await getRecentProjects(userRole, userId);

  // Get team member count
  let teamMembersCount = 0;
  if (userRole === "Admin") {
    const systemStats = await getSystemStatistics();
    teamMembersCount = systemStats.totalUsers;
  } else if (userRole === "Manager") {
    const teamStats = await getTeamStatistics(userRole, userId);
    teamMembersCount = teamStats.length;
  }

  // Build dashboard data in the format expected by frontend
  const dashboardData = {
    projectsCount: projectData.totalProjects || 0,
    activeTasksCount:
      (taskData.todoTasks || 0) + (taskData.inProgressTasks || 0),
    completedTasksCount: taskData.doneTasks || 0,
    teamMembersCount,
    recentProjects: recentProjects || [],
    recentActivities:
      recentActivities?.map((activity) => ({
        type: "task_updated",
        description: `${activity.title} was updated`,
        createdAt: activity.updatedAt,
      })) || [],
    projectsChange: 0, // Could be calculated based on historical data
    tasksChange: 0, // Could be calculated based on historical data
    completionChange: 0, // Could be calculated based on historical data
  };

  // Get overdue items
  const overdueItems = await getOverdueItems(userRole, userId);
  dashboardData.overdueItems = overdueItems;

  // Get upcoming deadlines
  const upcomingDeadlines = await getUpcomingDeadlines(userRole, userId);
  dashboardData.upcomingDeadlines = upcomingDeadlines;

  // Role-specific data
  if (userRole === "Admin") {
    dashboardData.systemStats = await getSystemStatistics();
  }

  if (userRole === "Manager" || userRole === "Admin") {
    dashboardData.teamStats = await getTeamStatistics(userRole, userId);
  }

  sendSuccess(res, dashboardData, "Dashboard data retrieved successfully");
});

// @desc    Get detailed analytics
// @route   GET /api/dashboard/analytics
// @access  Private (Admin/Manager)
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.validatedQuery || req.query;
  const userRole = req.user.role;
  const userId = req.user._id;

  let startDate = new Date();

  switch (period) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "1y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  // Build match conditions based on user role
  let projectMatchConditions = { createdAt: { $gte: startDate } };
  let taskMatchConditions = { createdAt: { $gte: startDate } };

  if (userRole === "Manager") {
    const managedProjects = await Project.find({ manager: userId }).select(
      "_id"
    );
    const projectIds = managedProjects.map((p) => p._id);
    projectMatchConditions.manager = userId;
    taskMatchConditions.project = { $in: projectIds };
  }

  // Project completion trends
  const projectTrends = await Project.aggregate([
    { $match: projectMatchConditions },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        created: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  // Task completion trends
  const taskTrends = await Task.aggregate([
    { $match: taskMatchConditions },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        created: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  // Performance metrics
  const performanceMetrics = await getPerformanceMetrics(
    userRole,
    userId,
    startDate
  );

  const analytics = {
    period,
    startDate,
    endDate: new Date(),
    projectTrends,
    taskTrends,
    performanceMetrics,
  };

  sendSuccess(res, analytics, "Analytics data retrieved successfully");
});

// @desc    Get team performance report
// @route   GET /api/dashboard/team-performance
// @access  Private (Admin/Manager)
const getTeamPerformance = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user._id;

  if (userRole === "Developer") {
    return sendError(
      res,
      "Access denied. This endpoint is for managers and admins only.",
      403
    );
  }

  let matchConditions = {};

  if (userRole === "Manager") {
    const managedProjects = await Project.find({ manager: userId }).select(
      "_id"
    );
    const projectIds = managedProjects.map((p) => p._id);
    matchConditions.project = { $in: projectIds };
  }

  // Get team member performance
  const teamPerformance = await Task.aggregate([
    { $match: { ...matchConditions, isActive: true } },
    {
      $group: {
        _id: "$assignedTo",
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] },
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
        },
        overdueTasks: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ["$dueDate", new Date()] },
                  { $ne: ["$status", "Done"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        totalEstimatedHours: { $sum: "$estimatedHours" },
        totalActualHours: { $sum: "$actualHours" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { password: 0 } }],
      },
    },
    { $unwind: "$user" },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $eq: ["$totalTasks", 0] },
            0,
            {
              $multiply: [{ $divide: ["$completedTasks", "$totalTasks"] }, 100],
            },
          ],
        },
        efficiency: {
          $cond: [
            { $eq: ["$totalEstimatedHours", 0] },
            0,
            { $divide: ["$totalActualHours", "$totalEstimatedHours"] },
          ],
        },
      },
    },
    { $sort: { completionRate: -1 } },
  ]);

  sendSuccess(
    res,
    teamPerformance,
    "Team performance data retrieved successfully"
  );
});

// Helper functions

// Consolidated role-based match conditions builder
const buildRoleMatchConditions = (userRole, userId, baseConditions = {}) => {
  const matchConditions = { ...baseConditions };

  if (userRole === "Manager") {
    // For managers, we'll add manager-specific conditions in the calling function
    return {
      ...matchConditions,
      _requiresManagerFilter: true,
      _userId: userId,
    };
  } else if (userRole === "Developer") {
    // For developers, we'll add developer-specific conditions in the calling function
    return {
      ...matchConditions,
      _requiresDeveloperFilter: true,
      _userId: userId,
    };
  }

  return matchConditions;
};

const getProjectStatistics = async (userRole, userId) => {
  let matchConditions = { isActive: true };

  if (userRole === "Manager") {
    matchConditions.manager = userId;
  } else if (userRole === "Developer") {
    matchConditions["teamMembers.user"] = userId;
  }

  return await Project.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        completedProjects: {
          $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
        },
        inProgressProjects: {
          $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
        },
        planningProjects: {
          $sum: { $cond: [{ $eq: ["$status", "Planning"] }, 1, 0] },
        },
      },
    },
  ]);
};

const getTaskStatistics = async (userRole, userId) => {
  let matchConditions = { isActive: true };

  if (userRole === "Developer") {
    matchConditions.assignedTo = userId;
  } else if (userRole === "Manager") {
    const managedProjects = await Project.find({ manager: userId }).select(
      "_id"
    );
    const projectIds = managedProjects.map((p) => p._id);
    matchConditions.project = { $in: projectIds };
  }

  return await Task.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        todoTasks: {
          $sum: { $cond: [{ $eq: ["$status", "To Do"] }, 1, 0] },
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
        },
        doneTasks: {
          $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] },
        },
      },
    },
  ]);
};

// Consolidated function to get managed project IDs for managers
const getManagedProjectIds = async (userId) => {
  const managedProjects = await Project.find({ manager: userId }).select("_id");
  return managedProjects.map((p) => p._id);
};

const getRecentActivities = async (userRole, userId) => {
  let matchConditions = { isActive: true };

  if (userRole === "Developer") {
    matchConditions.assignedTo = userId;
  } else if (userRole === "Manager") {
    const projectIds = await getManagedProjectIds(userId);
    matchConditions.project = { $in: projectIds };
  }

  return await Task.find(matchConditions)
    .populate("assignedTo", "firstName lastName")
    .populate("project", "name")
    .sort({ updatedAt: -1 })
    .limit(10)
    .select("title status updatedAt assignedTo project");
};

const getRecentProjects = async (userRole, userId) => {
  let matchConditions = { isActive: true };

  if (userRole === "Manager") {
    matchConditions.manager = userId;
  } else if (userRole === "Developer") {
    matchConditions["teamMembers.user"] = userId;
  }

  return await Project.find(matchConditions)
    .populate("manager", "firstName lastName")
    .sort({ updatedAt: -1 })
    .limit(5)
    .select("name description status updatedAt");
};

const getOverdueItems = async (userRole, userId) => {
  let taskMatchConditions = {
    dueDate: { $lt: new Date() },
    status: { $ne: "Done" },
    isActive: true,
  };

  let projectMatchConditions = {
    endDate: { $lt: new Date() },
    status: { $ne: "Completed" },
    isActive: true,
  };

  if (userRole === "Developer") {
    taskMatchConditions.assignedTo = userId;
    projectMatchConditions["teamMembers.user"] = userId;
  } else if (userRole === "Manager") {
    const projectIds = await getManagedProjectIds(userId);
    taskMatchConditions.project = { $in: projectIds };
    projectMatchConditions.manager = userId;
  }

  const [overdueTasks, overdueProjects] = await Promise.all([
    Task.find(taskMatchConditions)
      .populate("assignedTo", "firstName lastName")
      .populate("project", "name")
      .sort({ dueDate: 1 })
      .limit(5),
    Project.find(projectMatchConditions)
      .populate("manager", "firstName lastName")
      .sort({ endDate: 1 })
      .limit(5),
  ]);

  return { tasks: overdueTasks, projects: overdueProjects };
};

const getUpcomingDeadlines = async (userRole, userId) => {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  let taskMatchConditions = {
    dueDate: { $gte: new Date(), $lte: sevenDaysFromNow },
    status: { $ne: "Done" },
    isActive: true,
  };

  let projectMatchConditions = {
    endDate: { $gte: new Date(), $lte: sevenDaysFromNow },
    status: { $ne: "Completed" },
    isActive: true,
  };

  if (userRole === "Developer") {
    taskMatchConditions.assignedTo = userId;
    projectMatchConditions["teamMembers.user"] = userId;
  } else if (userRole === "Manager") {
    const projectIds = await getManagedProjectIds(userId);
    taskMatchConditions.project = { $in: projectIds };
    projectMatchConditions.manager = userId;
  }

  const [upcomingTasks, upcomingProjects] = await Promise.all([
    Task.find(taskMatchConditions)
      .populate("assignedTo", "firstName lastName")
      .populate("project", "name")
      .sort({ dueDate: 1 })
      .limit(10),
    Project.find(projectMatchConditions)
      .populate("manager", "firstName lastName")
      .sort({ endDate: 1 })
      .limit(5),
  ]);

  return { tasks: upcomingTasks, projects: upcomingProjects };
};

const getSystemStatistics = async () => {
  const totalUsers = await User.countDocuments();
  const totalProjects = await Project.countDocuments({ isActive: true });
  const totalTasks = await Task.countDocuments({ isActive: true });

  const recentRegistrations = await User.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });

  return {
    totalUsers,
    totalProjects,
    totalTasks,
    recentRegistrations,
  };
};

const getTeamStatistics = async (userRole, userId) => {
  let matchConditions = { isActive: true };

  if (userRole === "Manager") {
    const projectIds = await getManagedProjectIds(userId);
    matchConditions.project = { $in: projectIds };
  }

  return await Task.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: "$assignedTo",
        taskCount: { $sum: 1 },
        completedCount: {
          $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }],
      },
    },
    { $unwind: "$user" },
    {
      $addFields: {
        completionRate: {
          $cond: [
            { $eq: ["$taskCount", 0] },
            0,
            {
              $multiply: [{ $divide: ["$completedCount", "$taskCount"] }, 100],
            },
          ],
        },
      },
    },
    { $sort: { completionRate: -1 } },
    { $limit: 10 },
  ]);
};

const getPerformanceMetrics = async (userRole, userId, startDate) => {
  let matchConditions = { createdAt: { $gte: startDate } };

  if (userRole === "Manager") {
    const projectIds = await getManagedProjectIds(userId);
    matchConditions.project = { $in: projectIds };
  }

  const metrics = await Task.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        avgCompletionTime: {
          $avg: {
            $cond: [
              { $eq: ["$status", "Done"] },
              { $subtract: ["$completedAt", "$createdAt"] },
              null,
            ],
          },
        },
        totalEstimatedHours: { $sum: "$estimatedHours" },
        totalActualHours: { $sum: "$actualHours" },
        taskCount: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$status", "Done"] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        completionRate: {
          $multiply: [{ $divide: ["$completedTasks", "$taskCount"] }, 100],
        },
        estimationAccuracy: {
          $cond: [
            { $eq: ["$totalEstimatedHours", 0] },
            0,
            {
              $multiply: [
                { $divide: ["$totalEstimatedHours", "$totalActualHours"] },
                100,
              ],
            },
          ],
        },
      },
    },
  ]);

  return (
    metrics[0] || {
      avgCompletionTime: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
      taskCount: 0,
      completedTasks: 0,
      completionRate: 0,
      estimationAccuracy: 0,
    }
  );
};

export { getDashboard, getAnalytics, getTeamPerformance };
