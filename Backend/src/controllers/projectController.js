import { Project, User, Task } from "../models/index.js";
import {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  asyncHandler,
  getPagination,
  buildSearchPipeline,
  buildSortObject,
} from "../utils/helpers.js";

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Admin/Manager)
export const createProject = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    startDate,
    endDate,
    manager,
    priority,
    budget,
    tags,
  } = req.body;

  // Verify manager exists and has appropriate role
  const managerUser = await User.findById(manager);
  if (!managerUser) {
    return sendError(res, "Manager not found", 404);
  }

  if (!["Admin", "Manager"].includes(managerUser.role)) {
    return sendError(
      res,
      "Assigned manager must have Admin or Manager role",
      400
    );
  }

  // Check for project name uniqueness
  const existingProject = await Project.findOne({ name, isActive: true });
  if (existingProject) {
    return sendError(res, "Project with this name already exists", 400);
  }

  const project = await Project.create({
    name,
    description,
    startDate,
    endDate,
    manager,
    priority,
    budget,
    tags,
    teamMembers: [
      {
        user: manager,
        role: "Manager",
        assignedDate: new Date(),
      },
    ],
  });

  const populatedProject = await Project.findById(project._id)
    .populate("manager", "firstName lastName email role")
    .populate("teamMembers.user", "firstName lastName email role");

  sendSuccess(res, populatedProject, "Project created successfully", 201);
});

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getAllProjects = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    priority,
    manager,
    startDate,
    endDate,
  } = req.validatedQuery || req.query;

  // Build filter object
  const filter = { isActive: true };

  // Role-based filtering
  if (req.user.role === "Developer") {
    // Developers can only see projects they're assigned to
    filter["teamMembers.user"] = req.user._id;
  }

  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }

  if (priority) {
    filter.priority = Array.isArray(priority) ? { $in: priority } : priority;
  }

  if (manager) {
    filter.manager = manager;
  }

  // Date range filter
  if (startDate || endDate) {
    filter.startDate = {};
    if (startDate) filter.startDate.$gte = new Date(startDate);
    if (endDate) filter.startDate.$lte = new Date(endDate);
  }

  // Build aggregation pipeline
  let pipeline = [{ $match: filter }];

  // Add search functionality
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // Get total count
  const totalPipeline = [...pipeline, { $count: "total" }];
  const totalResult = await Project.aggregate(totalPipeline);
  const total = totalResult[0]?.total || 0;

  // Add population and pagination
  const sortObj = buildSortObject((req.validatedQuery || req.query).sort);
  pipeline.push(
    { $sort: sortObj },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: "users",
        localField: "manager",
        foreignField: "_id",
        as: "manager",
        pipeline: [{ $project: { password: 0 } }],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "teamMembers.user",
        foreignField: "_id",
        as: "teamMemberDetails",
        pipeline: [{ $project: { password: 0 } }],
      },
    },
    { $unwind: "$manager" }
  );

  const projects = await Project.aggregate(pipeline);
  const pagination = getPagination(page, limit, total);

  sendPaginatedResponse(
    res,
    projects,
    pagination,
    "Projects retrieved successfully"
  );
});

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate("manager", "firstName lastName email role department")
    .populate("teamMembers.user", "firstName lastName email role department");

  if (!project) {
    return sendError(res, "Project not found", 404);
  }

  // Check if user has access to this project
  if (req.user.role === "Developer") {
    const isTeamMember = project.teamMembers.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isTeamMember) {
      return sendError(
        res,
        "Access denied. You are not assigned to this project.",
        403
      );
    }
  }

  // Get project tasks count
  const tasksStats = await Task.aggregate([
    { $match: { project: project._id, isActive: true } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const tasksSummary = {
    total: tasksStats.reduce((sum, stat) => sum + stat.count, 0),
    todo: tasksStats.find((s) => s._id === "To Do")?.count || 0,
    inProgress: tasksStats.find((s) => s._id === "In Progress")?.count || 0,
    done: tasksStats.find((s) => s._id === "Done")?.count || 0,
  };

  const projectWithStats = {
    ...project.toObject(),
    tasksSummary,
  };

  sendSuccess(res, projectWithStats, "Project retrieved successfully");
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/Manager/Project Manager)
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    status,
    priority,
    startDate,
    endDate,
    budget,
    completionPercentage,
    tags,
  } = req.body;

  const project = await Project.findById(id);

  if (!project) {
    return sendError(res, "Project not found", 404);
  }

  // Check permissions
  if (
    req.user.role === "Developer" ||
    (req.user.role === "Manager" &&
      project.manager.toString() !== req.user._id.toString())
  ) {
    return sendError(
      res,
      "Access denied. You can only update projects you manage.",
      403
    );
  }

  // Check for name uniqueness if name is being changed
  if (name && name !== project.name) {
    const existingProject = await Project.findOne({
      name,
      isActive: true,
      _id: { $ne: id },
    });
    if (existingProject) {
      return sendError(res, "Project with this name already exists", 400);
    }
  }

  const updatedProject = await Project.findByIdAndUpdate(
    id,
    {
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      budget,
      completionPercentage,
      tags,
    },
    { new: true, runValidators: true }
  )
    .populate("manager", "firstName lastName email role")
    .populate("teamMembers.user", "firstName lastName email role");

  sendSuccess(res, updatedProject, "Project updated successfully");
});

// @desc    Add team member to project
// @route   POST /api/projects/:id/team-members
// @access  Private (Admin/Manager/Project Manager)
export const addTeamMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.body;

  const project = await Project.findById(id);

  if (!project) {
    return sendError(res, "Project not found", 404);
  }

  // Check permissions
  if (
    req.user.role === "Developer" ||
    (req.user.role === "Manager" &&
      project.manager.toString() !== req.user._id.toString())
  ) {
    return sendError(
      res,
      "Access denied. You can only manage projects you own.",
      403
    );
  }

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  // Check if user is already a team member
  const existingMember = project.teamMembers.find(
    (member) => member.user.toString() === userId
  );

  if (existingMember) {
    return sendError(res, "User is already a team member", 400);
  }

  project.addTeamMember(userId, role);
  await project.save();

  const updatedProject = await Project.findById(id)
    .populate("manager", "firstName lastName email role")
    .populate("teamMembers.user", "firstName lastName email role");

  sendSuccess(res, updatedProject, "Team member added successfully");
});

// @desc    Remove team member from project
// @route   DELETE /api/projects/:id/team-members/:userId
// @access  Private (Admin/Manager/Project Manager)
export const removeTeamMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    return sendError(res, "Project not found", 404);
  }

  // Check permissions
  if (
    req.user.role === "Developer" ||
    (req.user.role === "Manager" &&
      project.manager.toString() !== req.user._id.toString())
  ) {
    return sendError(
      res,
      "Access denied. You can only manage projects you own.",
      403
    );
  }

  // Cannot remove project manager
  if (project.manager.toString() === userId) {
    return sendError(res, "Cannot remove project manager from team", 400);
  }

  project.removeTeamMember(userId);
  await project.save();

  const updatedProject = await Project.findById(id)
    .populate("manager", "firstName lastName email role")
    .populate("teamMembers.user", "firstName lastName email role");

  sendSuccess(res, updatedProject, "Team member removed successfully");
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    return sendError(res, "Project not found", 404);
  }

  // Check if project has active tasks
  const activeTasks = await Task.countDocuments({
    project: id,
    isActive: true,
  });
  if (activeTasks > 0) {
    return sendError(res, "Cannot delete project with active tasks", 400);
  }

  await Project.findByIdAndDelete(id);

  sendSuccess(res, null, "Project deleted successfully");
});

// @desc    Archive project
// @route   PUT /api/projects/:id/archive
// @access  Private (Admin/Project Manager)
export const archiveProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);

  if (!project) {
    return sendError(res, "Project not found", 404);
  }

  // Check permissions
  if (
    req.user.role !== "Admin" &&
    project.manager.toString() !== req.user._id.toString()
  ) {
    return sendError(
      res,
      "Access denied. You can only archive projects you manage.",
      403
    );
  }

  project.isActive = false;
  project.status = "Completed";
  await project.save();

  sendSuccess(res, project, "Project archived successfully");
});

// @desc    Get project statistics
// @route   GET /api/projects/stats
// @access  Private (Admin/Manager)
export const getProjectStats = asyncHandler(async (req, res) => {
  // Build match conditions based on user role
  let matchConditions = { isActive: true };

  if (req.user.role === "Manager") {
    matchConditions.manager = req.user._id;
  }

  const stats = await Project.aggregate([
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
        onHoldProjects: {
          $sum: { $cond: [{ $eq: ["$status", "On Hold"] }, 1, 0] },
        },
        averageBudget: { $avg: "$budget" },
        totalBudget: { $sum: "$budget" },
      },
    },
  ]);

  const priorityStats = await Project.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  const overdueProjects = await Project.aggregate([
    {
      $match: {
        ...matchConditions,
        endDate: { $lt: new Date() },
        status: { $ne: "Completed" },
      },
    },
    { $count: "count" },
  ]);

  const result = {
    general: stats[0] || {
      totalProjects: 0,
      completedProjects: 0,
      inProgressProjects: 0,
      planningProjects: 0,
      onHoldProjects: 0,
      averageBudget: 0,
      totalBudget: 0,
    },
    byPriority: priorityStats,
    overdueCount: overdueProjects[0]?.count || 0,
  };

  sendSuccess(res, result, "Project statistics retrieved successfully");
});

// @desc    Get projects assigned to current user
// @route   GET /api/projects/my-projects
// @access  Private
export const getMyProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.validatedQuery || req.query;

  const filter = {
    isActive: true,
    "teamMembers.user": req.user._id,
  };

  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }

  const total = await Project.countDocuments(filter);

  const projects = await Project.find(filter)
    .populate("manager", "firstName lastName email")
    .populate("teamMembers.user", "firstName lastName email role")
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const pagination = getPagination(page, limit, total);

  sendPaginatedResponse(
    res,
    projects,
    pagination,
    "Your projects retrieved successfully"
  );
});
