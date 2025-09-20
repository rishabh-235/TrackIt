import { User } from "../models/index.js";
import {
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
} from "../utils/auth.js";
import {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  asyncHandler,
  getPagination,
  buildSearchPipeline,
  buildSortObject,
} from "../utils/helpers.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (Admin only in production)
export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role, phone, department } =
    req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, "User with this email already exists", 400);
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: role || "Developer",
    phone,
    department,
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({ id: user._id });

  // Set cookies
  setAuthCookies(res, { accessToken, refreshToken });

  // Remove password from response
  user.password = undefined;

  sendSuccess(
    res,
    {
      user,
      accessToken, // Send access token in response for client-side usage if needed
    },
    "User registered successfully",
    201
  );
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for verification
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return sendError(res, "Invalid email or password", 401);
  }

  if (!user.isActive) {
    return sendError(res, "Account is deactivated. Please contact admin.", 401);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, "Invalid email or password", 401);
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({ id: user._id });

  // Set cookies
  setAuthCookies(res, { accessToken, refreshToken });

  // Remove password from response
  user.password = undefined;

  sendSuccess(
    res,
    {
      user,
      accessToken, // Send access token in response for client-side usage if needed
    },
    "Login successful"
  );
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendSuccess(res, user, "Profile retrieved successfully");
});

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, department, profilePicture } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      firstName,
      lastName,
      phone,
      department,
      profilePicture,
    },
    { new: true, runValidators: true }
  );

  sendSuccess(res, user, "Profile updated successfully");
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select("+password");

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return sendError(res, "Current password is incorrect", 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccess(res, null, "Password changed successfully");
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Manager)
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    isActive,
  } = req.validatedQuery || req.query;

  // Build filter object
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  // Build aggregation pipeline
  let pipeline = [];

  // Add search functionality
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { department: { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  // Add filters
  if (Object.keys(filter).length > 0) {
    pipeline.push({ $match: filter });
  }

  // Get total count
  const totalPipeline = [...pipeline, { $count: "total" }];
  const totalResult = await User.aggregate(totalPipeline);
  const total = totalResult[0]?.total || 0;

  // Add pagination and sorting
  const sortObj = buildSortObject((req.validatedQuery || req.query).sort);
  pipeline.push(
    { $sort: sortObj },
    { $skip: (page - 1) * limit },
    { $limit: parseInt(limit) },
    { $project: { password: 0 } } // Exclude password
  );

  const users = await User.aggregate(pipeline);
  const pagination = getPagination(page, limit, total);

  sendPaginatedResponse(res, users, pagination, "Users retrieved successfully");
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin/Manager or own profile)
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user can access this profile
  if (
    req.user.role !== "Admin" &&
    req.user.role !== "Manager" &&
    req.user._id.toString() !== id
  ) {
    return sendError(res, "Access denied", 403);
  }

  const user = await User.findById(id);

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  sendSuccess(res, user, "User retrieved successfully");
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, department, profilePicture, isActive } =
    req.body;

  const user = await User.findByIdAndUpdate(
    id,
    {
      firstName,
      lastName,
      phone,
      department,
      profilePicture,
      isActive,
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  sendSuccess(res, user, "User updated successfully");
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  sendSuccess(res, user, "User role updated successfully");
});

// @desc    Deactivate user
// @route   PUT /api/users/:id/deactivate
// @access  Private (Admin only)
export const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deactivating themselves
  if (req.user._id.toString() === id) {
    return sendError(res, "You cannot deactivate your own account", 400);
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  sendSuccess(res, user, "User deactivated successfully");
});

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private (Admin only)
export const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  sendSuccess(res, user, "User activated successfully");
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user._id.toString() === id) {
    return sendError(res, "You cannot delete your own account", 400);
  }

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  sendSuccess(res, null, "User deleted successfully");
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin/Manager)
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
        inactiveUsers: {
          $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalUsers: 1,
        activeUsers: 1,
        inactiveUsers: 1,
      },
    },
  ]);

  const roleStats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        role: "$_id",
        count: 1,
        _id: 0,
      },
    },
  ]);

  const result = {
    general: stats[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 },
    byRole: roleStats,
  };

  sendSuccess(res, result, "User statistics retrieved successfully");
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (requires refresh token in cookies)
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return sendError(res, "Refresh token not found", 401);
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return sendError(res, "Invalid refresh token", 401);
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user._id,
    });

    // Set new cookies
    setAuthCookies(res, { accessToken, refreshToken: newRefreshToken });

    sendSuccess(
      res,
      {
        accessToken,
      },
      "Token refreshed successfully"
    );
  } catch (error) {
    return sendError(res, "Invalid refresh token", 401);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
// @desc    Get managers and admins (accessible to all authenticated users)
// @route   GET /api/managers
// @access  Private (All authenticated users)
export const getManagers = asyncHandler(async (req, res) => {
  // Find users with Manager or Admin roles
  const managers = await User.find({
    role: { $in: ["Manager", "Admin"] },
    isActive: true,
  })
    .select("firstName lastName email role department")
    .sort({ firstName: 1, lastName: 1 });

  sendSuccess(res, managers, "Managers retrieved successfully");
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // Clear auth cookies
  clearAuthCookies(res);

  sendSuccess(res, null, "Logged out successfully");
});
