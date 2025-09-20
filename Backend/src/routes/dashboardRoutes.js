import express from "express";
import {
  getDashboard,
  getAnalytics,
  getTeamPerformance,
} from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../utils/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get comprehensive dashboard data
router.get("/", getDashboard);

// Get detailed analytics (Admin/Manager only)
router.get("/analytics", authorize("Admin", "Manager"), getAnalytics);

// Get team performance report (Admin/Manager only)
router.get(
  "/team-performance",
  authorize("Admin", "Manager"),
  getTeamPerformance
);

export default router;
