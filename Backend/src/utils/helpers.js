// Response handler utility functions

export const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res,
  message = "An error occurred",
  statusCode = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export const sendPaginatedResponse = (
  res,
  data,
  pagination,
  message = "Success"
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error("Error:", err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    return sendError(res, message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return sendError(res, message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    return sendError(res, "Validation error", 400, errors);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token expired", 401);
  }

  // Default error
  return sendError(
    res,
    error.message || "Server Error",
    error.statusCode || 500
  );
};

// Not found middleware
export const notFound = (req, res, next) => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
};

// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Pagination helper
export const getPagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems: total,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? currentPage + 1 : null,
    prevPage: hasPrevPage ? currentPage - 1 : null,
  };
};

// Build MongoDB aggregation pipeline for search
export const buildSearchPipeline = (searchFields, searchTerm) => {
  if (!searchTerm) return [];

  const searchRegex = new RegExp(searchTerm, "i");

  return [
    {
      $match: {
        $or: searchFields.map((field) => ({
          [field]: { $regex: searchRegex },
        })),
      },
    },
  ];
};

// Build sort object from query string
export const buildSortObject = (sortString) => {
  const sortObj = {};

  if (sortString) {
    const parts = sortString.split(",");
    parts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed.startsWith("-")) {
        sortObj[trimmed.substring(1)] = -1;
      } else {
        sortObj[trimmed] = 1;
      }
    });
  } else {
    sortObj.createdAt = -1; // Default sort
  }

  return sortObj;
};
