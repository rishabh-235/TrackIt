import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  addTeamMember,
  removeTeamMember,
  deleteProject,
  archiveProject,
  getProjectStats,
  getMyProjects,
} from "../controllers/projectController.js";
import { authenticate, authorize, isAdmin } from "../utils/auth.js";
import { validate, validateQuery } from "../utils/validation.js";
import { projectValidation, queryValidation } from "../utils/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get project statistics
router.get("/stats", authorize("Admin", "Manager"), getProjectStats);

// Get current user's projects
router.get(
  "/my-projects",
  validateQuery(queryValidation.pagination),
  getMyProjects
);

// Get all projects
router.get("/", validateQuery(queryValidation.pagination), getAllProjects);

// Create new project
router.post(
  "/",
  authorize("Admin", "Manager"),
  validate(projectValidation.create),
  createProject
);

// Get project by ID
router.get("/:id", getProjectById);

// Update project
router.put(
  "/:id",
  authorize("Admin", "Manager"),
  validate(projectValidation.update),
  updateProject
);

// Archive project
router.put("/:id/archive", authorize("Admin", "Manager"), archiveProject);

// Add team member
router.post(
  "/:id/team-members",
  authorize("Admin", "Manager"),
  validate(projectValidation.addTeamMember),
  addTeamMember
);

// Remove team member
router.delete(
  "/:id/team-members/:userId",
  authorize("Admin", "Manager"),
  removeTeamMember
);

// Delete project (Admin only)
router.delete("/:id", isAdmin, deleteProject);

export default router;
