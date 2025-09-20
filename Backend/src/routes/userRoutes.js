import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deactivateUser,
  activateUser,
  deleteUser,
  getUserStats,
  getManagers,
} from "../controllers/userController.js";
import { authenticate, authorize, isAdmin } from "../utils/auth.js";
import { validate, validateQuery } from "../utils/validation.js";
import { userValidation, queryValidation } from "../utils/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get managers (accessible to all authenticated users)
router.get("/managers", getManagers);

// Get user statistics
router.get("/stats", authorize("Admin", "Manager"), getUserStats);

// Get all users
router.get(
  "/",
  authorize("Admin", "Manager"),
  validateQuery(queryValidation.pagination),
  getAllUsers
);

// Get user by ID
router.get("/:id", getUserById);

// Update user (Admin only)
router.put("/:id", isAdmin, validate(userValidation.update), updateUser);

// Update user role (Admin only)
router.put(
  "/:id/role",
  isAdmin,
  validate(userValidation.updateRole),
  updateUserRole
);

// Deactivate user (Admin only)
router.put("/:id/deactivate", isAdmin, deactivateUser);

// Activate user (Admin only)
router.put("/:id/activate", isAdmin, activateUser);

// Delete user (Admin only)
router.delete("/:id", isAdmin, deleteUser);

export default router;
