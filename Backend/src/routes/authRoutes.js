import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
} from "../controllers/userController.js";
import { authenticate } from "../utils/auth.js";
import { validate } from "../utils/validation.js";
import { userValidation } from "../utils/validation.js";

const router = express.Router();

// Public routes
router.post("/register", validate(userValidation.register), register);
router.post("/login", validate(userValidation.login), login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Protected routes
router.use(authenticate); // All routes below this middleware require authentication

router.get("/profile", getProfile);
router.put("/profile", validate(userValidation.update), updateProfile);
router.put(
  "/change-password",
  validate(userValidation.changePassword),
  changePassword
);

export default router;
