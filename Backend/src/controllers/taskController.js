import { Task, Project, User } from "../models/index.js";
import {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  asyncHandler,
  getPagination,
  buildSearchPipeline,
  buildSortObject,
} from "../utils/helpers.js";

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin/Manager/Project Manager)
export const createTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    assignedTo,
    project,
    dueDate,
    priority,
    estimatedHours,
    tags,
  } = req.body;

  // Verify project exists and user has access
  const projectDoc = await Project.findById(project);
  if (!projectDoc) {
    return sendError(res, "Project not found", 404);
  }

  // Check permissions
  if (req.user.role === "Developer") {
    const isTeamMember = projectDoc.teamMembers.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!isTeamMember) {
      return sendError(
        res,
        "Access denied. You can only create tasks for projects you are assigned to.",
        403
      );
    }
  } else if (
    req.user.role === "Manager" &&
    projectDoc.manager.toString() !== req.user._id.toString()
  ) {
    return sendError(
      res,
      "Access denied. You can only create tasks for projects you manage.",
      403
    );
  }

  // Verify assigned user exists and is part of the project
  const assignedUser = await User.findById(assignedTo);
  if (!assignedUser) {
    return sendError(res, "Assigned user not found", 404);
  }

  const isAssignedUserInProject = projectDoc.teamMembers.some(
    (member) => member.user.toString() === assignedTo
  );
  if (!isAssignedUserInProject) {
    return sendError(
      res,
      "Cannot assign task to user who is not part of the project",
      400
    );
  }

  const task = await Task.create({
    title,
    description,
    assignedTo,
    project,
    createdBy: req.user._id,
    dueDate,
    priority,
    estimatedHours,
    tags,
  });

  const populatedTask = await Task.findById(task._id)
    .populate("assignedTo", "firstName lastName email role")
    .populate("project", "name description")
    .populate("createdBy", "firstName lastName email");

  sendSuccess(res, populatedTask, "Task created successfully", 201);
});

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getAllTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    priority,
    assignedTo,
    project,
    dueDateFrom,
    dueDateTo,
    overdue,
  } = req.validatedQuery || req.query;

  // Build base filter
  let filter = { isActive: true };

  // Role-based filtering
  if (req.user.role === "Developer") {
    filter.assignedTo = req.user._id;
  } else if (req.user.role === "Manager") {
    // Managers see tasks from projects they manage
    const managedProjects = await Project.find({
      manager: req.user._id,
    }).select("_id");
    const projectIds = managedProjects.map((p) => p._id);
    filter.project = { $in: projectIds };
  }

  // Apply filters
  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }

  if (priority) {
    filter.priority = Array.isArray(priority) ? { $in: priority } : priority;
  }

  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (project) {
    filter.project = project;
  }

  // Due date filtering
  if (dueDateFrom || dueDateTo) {
    filter.dueDate = {};
    if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom);
    if (dueDateTo) filter.dueDate.$lte = new Date(dueDateTo);
  }

  // Overdue filter
  if (overdue === "true") {
    filter.dueDate = { $lt: new Date() };
    filter.status = { $ne: "Done" };
  }

  // Build aggregation pipeline
  let pipeline = [{ $match: filter }];

  // Add search functionality
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // Get total count
  const totalPipeline = [...pipeline, { $count: "total" }];
  const totalResult = await Task.aggregate(totalPipeline);
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
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [{ $project: { password: 0 } }],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [{ $project: { password: 0 } }],
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
      },
    },
    { $unwind: "$assignedTo" },
    { $unwind: "$createdBy" },
    { $unwind: "$project" }
  );

  const tasks = await Task.aggregate(pipeline);
  const pagination = getPagination(page, limit, total);

  sendPaginatedResponse(res, tasks, pagination, "Tasks retrieved successfully");
});

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id)
    .populate("assignedTo", "firstName lastName email role department")
    .populate("project", "name description manager")
    .populate("createdBy", "firstName lastName email")
    .populate("comments.user", "firstName lastName email");

  if (!task) {
    return sendError(res, "Task not found", 404);
  }

  // Check access permissions
  if (req.user.role === "Developer") {
    if (task.assignedTo._id.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        "Access denied. You can only view tasks assigned to you.",
        403
      );
    }
  } else if (req.user.role === "Manager") {
    if (task.project.manager.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        "Access denied. You can only view tasks from projects you manage.",
        403
      );
    }
  }

  sendSuccess(res, task, "Task retrieved successfully");
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    status,
    priority,
    assignedTo,
    dueDate,
    estimatedHours,
    actualHours,
    tags,
  } = req.body;

  const task = await Task.findById(id).populate("project");

  if (!task) {
    return sendError(res, "Task not found", 404);
  }

  // Check permissions
  let canUpdate = false;

  if (req.user.role === "Admin") {
    canUpdate = true;
  } else if (
    req.user.role === "Manager" &&
    task.project.manager.toString() === req.user._id.toString()
  ) {
    canUpdate = true;
  } else if (
    req.user.role === "Developer" &&
    task.assignedTo.toString() === req.user._id.toString()
  ) {
    // Developers can only update status and actual hours
    canUpdate = true;
    if (
      title ||
      description ||
      priority ||
      assignedTo ||
      dueDate ||
      estimatedHours ||
      tags
    ) {
      return sendError(
        res,
        "Developers can only update task status and actual hours",
        403
      );
    }
  }

  if (!canUpdate) {
    return sendError(res, "Access denied", 403);
  }

  // If changing assignedTo, verify the new user is part of the project
  if (assignedTo && assignedTo !== task.assignedTo.toString()) {
    const project = await Project.findById(task.project._id);
    const isNewAssigneeInProject = project.teamMembers.some(
      (member) => member.user.toString() === assignedTo
    );
    if (!isNewAssigneeInProject) {
      return sendError(
        res,
        "Cannot assign task to user who is not part of the project",
        400
      );
    }
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
  if (dueDate !== undefined) updateData.dueDate = dueDate;
  if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
  if (actualHours !== undefined) updateData.actualHours = actualHours;
  if (tags !== undefined) updateData.tags = tags;

  const updatedTask = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("assignedTo", "firstName lastName email role")
    .populate("project", "name description")
    .populate("createdBy", "firstName lastName email");

  sendSuccess(res, updatedTask, "Task updated successfully");
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin/Manager/Project Manager)
export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id).populate("project");

  if (!task) {
    return sendError(res, "Task not found", 404);
  }

  // Check permissions
  if (req.user.role === "Developer") {
    return sendError(
      res,
      "Access denied. Developers cannot delete tasks.",
      403
    );
  }

  if (
    req.user.role === "Manager" &&
    task.project.manager.toString() !== req.user._id.toString()
  ) {
    return sendError(
      res,
      "Access denied. You can only delete tasks from projects you manage.",
      403
    );
  }

  await Task.findByIdAndDelete(id);

  sendSuccess(res, null, "Task deleted successfully");
});

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
export const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const task = await Task.findById(id).populate("project");

  if (!task) {
    return sendError(res, "Task not found", 404);
  }

  // Check access permissions
  if (req.user.role === "Developer") {
    if (task.assignedTo.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        "Access denied. You can only comment on tasks assigned to you.",
        403
      );
    }
  } else if (req.user.role === "Manager") {
    if (task.project.manager.toString() !== req.user._id.toString()) {
      return sendError(
        res,
        "Access denied. You can only comment on tasks from projects you manage.",
        403
      );
    }
  }

  task.addComment(req.user._id, content);
  await task.save();

  const updatedTask = await Task.findById(id)
    .populate("comments.user", "firstName lastName email")
    .populate("assignedTo", "firstName lastName email")
    .populate("project", "name");

  sendSuccess(res, updatedTask, "Comment added successfully");
});

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks/my-tasks
// @access  Private
export const getMyTasks = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
  } = req.validatedQuery || req.query;

  const filter = {
    assignedTo: req.user._id,
    isActive: true,
  };

  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }

  if (priority) {
    filter.priority = Array.isArray(priority) ? { $in: priority } : priority;
  }

  const total = await Task.countDocuments(filter);

  const tasks = await Task.find(filter)
    .populate("project", "name description")
    .populate("createdBy", "firstName lastName email")
    .sort({ dueDate: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const pagination = getPagination(page, limit, total);

  sendPaginatedResponse(
    res,
    tasks,
    pagination,
    "Your tasks retrieved successfully"
  );
});

// @desc    Get overdue tasks
// @route   GET /api/tasks/overdue
// @access  Private
export const getOverdueTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.validatedQuery || req.query;

  let filter = {
    dueDate: { $lt: new Date() },
    status: { $ne: "Done" },
    isActive: true,
  };

  // Role-based filtering
  if (req.user.role === "Developer") {
    filter.assignedTo = req.user._id;
  } else if (req.user.role === "Manager") {
    const managedProjects = await Project.find({
      manager: req.user._id,
    }).select("_id");
    const projectIds = managedProjects.map((p) => p._id);
    filter.project = { $in: projectIds };
  }

  const total = await Task.countDocuments(filter);

  const tasks = await Task.find(filter)
    .populate("assignedTo", "firstName lastName email")
    .populate("project", "name description")
    .populate("createdBy", "firstName lastName email")
    .sort({ dueDate: 1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const pagination = getPagination(page, limit, total);

  sendPaginatedResponse(
    res,
    tasks,
    pagination,
    "Overdue tasks retrieved successfully"
  );
});

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
export const getTaskStats = asyncHandler(async (req, res) => {
  // Build match conditions based on user role
  let matchConditions = { isActive: true };

  if (req.user.role === "Developer") {
    matchConditions.assignedTo = req.user._id;
  } else if (req.user.role === "Manager") {
    const managedProjects = await Project.find({
      manager: req.user._id,
    }).select("_id");
    const projectIds = managedProjects.map((p) => p._id);
    matchConditions.project = { $in: projectIds };
  }

  const stats = await Task.aggregate([
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
        averageEstimatedHours: { $avg: "$estimatedHours" },
        totalEstimatedHours: { $sum: "$estimatedHours" },
        totalActualHours: { $sum: "$actualHours" },
      },
    },
  ]);

  const priorityStats = await Task.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  const overdueStats = await Task.aggregate([
    {
      $match: {
        ...matchConditions,
        dueDate: { $lt: new Date() },
        status: { $ne: "Done" },
      },
    },
    { $count: "count" },
  ]);

  const result = {
    general: stats[0] || {
      totalTasks: 0,
      todoTasks: 0,
      inProgressTasks: 0,
      doneTasks: 0,
      averageEstimatedHours: 0,
      totalEstimatedHours: 0,
      totalActualHours: 0,
    },
    byPriority: priorityStats,
    overdueCount: overdueStats[0]?.count || 0,
  };

  sendSuccess(res, result, "Task statistics retrieved successfully");
});
