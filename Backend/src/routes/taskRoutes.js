import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  getMyTasks,
  getOverdueTasks,
  getTaskStats,
} from "../controllers/taskController.js";
import { authenticate, authorize } from "../utils/auth.js";
import { validate, validateQuery } from "../utils/validation.js";
import { taskValidation, queryValidation } from "../utils/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get task statistics
router.get("/stats", getTaskStats);

// Get current user's tasks
router.get("/my-tasks", validateQuery(queryValidation.pagination), getMyTasks);

// Get overdue tasks
router.get(
  "/overdue",
  validateQuery(queryValidation.pagination),
  getOverdueTasks
);

// Get all tasks
router.get("/", validateQuery(queryValidation.pagination), getAllTasks);

// Create new task
router.post("/", validate(taskValidation.create), createTask);

// Get task by ID
router.get("/:id", getTaskById);

// Update task
router.put("/:id", validate(taskValidation.update), updateTask);

// Add comment to task
router.post("/:id/comments", validate(taskValidation.addComment), addComment);

// Delete task
router.delete("/:id", authorize("Admin", "Manager"), deleteTask);

export default router;
