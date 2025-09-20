import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

// Generate access token (short-lived)
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "15m", // Short-lived access token
  });
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: "7d", // Long-lived refresh token
    }
  );
};

// Generate both tokens
export const generateTokens = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
};

// Verify access token
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
  );
};

// Set auth cookies
export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  // Set refresh token as httpOnly cookie (most secure)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Access token can be sent in response body for easier client handling
  // Or also set as a cookie if preferred
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
};

// Clear auth cookies
export const clearAuthCookies = (res) => {
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
};

// Legacy function for backward compatibility
export const generateToken = (payload) => {
  return generateAccessToken(payload);
};

// Legacy function for backward compatibility
export const verifyToken = (token) => {
  return verifyAccessToken(token);
};

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from cookies first, then from header
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact admin.",
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error during authentication.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
};

// Check if user is admin
export const isAdmin = authorize("Admin");

// Check if user is admin or manager
export const isAdminOrManager = authorize("Admin", "Manager");

// Check if user can access resource (own resource or admin/manager)
export const canAccessResource = (resourceUserId) => {
  return (req, res, next) => {
    const currentUser = req.user;

    // Admin and Manager can access any resource
    if (currentUser.role === "Admin" || currentUser.role === "Manager") {
      return next();
    }

    // Users can only access their own resources
    if (currentUser._id.toString() === resourceUserId.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own resources.",
    });
  };
};

// Optional authentication (for public routes that can benefit from user context)
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from cookies first, then from header
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select("-password");

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
