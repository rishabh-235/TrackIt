import Joi from "joi";

// User validation schemas
export const userValidation = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
      "string.min": "First name must be at least 2 characters long",
      "string.max": "First name cannot exceed 50 characters",
      "any.required": "First name is required",
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      "string.min": "Last name must be at least 2 characters long",
      "string.max": "Last name cannot exceed 50 characters",
      "any.required": "Last name is required",
    }),
    role: Joi.string()
      .valid("Admin", "Manager", "Developer")
      .default("Developer"),
    phone: Joi.string()
      .pattern(/^\+?[\d\s-()]+$/)
      .allow(null, "")
      .messages({
        "string.pattern.base": "Please provide a valid phone number",
      }),
    department: Joi.string().max(100).allow(null, ""),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),

  update: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    phone: Joi.string()
      .pattern(/^\+?[\d\s-()]+$/)
      .allow(null, ""),
    department: Joi.string().max(100).allow(null, ""),
    profilePicture: Joi.string().uri().allow(null, ""),
  }),

  updateRole: Joi.object({
    role: Joi.string().valid("Admin", "Manager", "Developer").required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Current password is required",
    }),
    newPassword: Joi.string().min(6).required().messages({
      "string.min": "New password must be at least 6 characters long",
      "any.required": "New password is required",
    }),
  }),
};

// Project validation schemas
export const projectValidation = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
      "string.min": "Project name must be at least 3 characters long",
      "string.max": "Project name cannot exceed 100 characters",
      "any.required": "Project name is required",
    }),
    description: Joi.string().min(10).max(500).required().messages({
      "string.min": "Project description must be at least 10 characters long",
      "string.max": "Project description cannot exceed 500 characters",
      "any.required": "Project description is required",
    }),
    startDate: Joi.date().min("now").required().messages({
      "date.min": "Start date cannot be in the past",
      "any.required": "Start date is required",
    }),
    endDate: Joi.date().greater(Joi.ref("startDate")).required().messages({
      "date.greater": "End date must be after start date",
      "any.required": "End date is required",
    }),
    manager: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid manager ID format",
        "any.required": "Project manager is required",
      }),
    priority: Joi.string()
      .valid("Low", "Medium", "High", "Critical")
      .default("Medium"),
    budget: Joi.number().min(0).default(0),
    tags: Joi.array().items(Joi.string().max(30)),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().min(10).max(500),
    status: Joi.string().valid(
      "Planning",
      "In Progress",
      "Completed",
      "On Hold",
      "Cancelled"
    ),
    priority: Joi.string().valid("Low", "Medium", "High", "Critical"),
    startDate: Joi.date(),
    endDate: Joi.date(),
    budget: Joi.number().min(0),
    completionPercentage: Joi.number().min(0).max(100),
    tags: Joi.array().items(Joi.string().max(30)),
  }),

  addTeamMember: Joi.object({
    userId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid user ID format",
        "any.required": "User ID is required",
      }),
    role: Joi.string()
      .valid("Manager", "Developer", "Designer", "Tester")
      .default("Developer"),
  }),
};

// Task validation schemas
export const taskValidation = {
  create: Joi.object({
    title: Joi.string().min(3).max(100).required().messages({
      "string.min": "Task title must be at least 3 characters long",
      "string.max": "Task title cannot exceed 100 characters",
      "any.required": "Task title is required",
    }),
    description: Joi.string().min(10).max(1000).required().messages({
      "string.min": "Task description must be at least 10 characters long",
      "string.max": "Task description cannot exceed 1000 characters",
      "any.required": "Task description is required",
    }),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid assignee ID format",
        "any.required": "Task must be assigned to a user",
      }),
    project: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid project ID format",
        "any.required": "Task must belong to a project",
      }),
    dueDate: Joi.date().min("now").required().messages({
      "date.min": "Due date cannot be in the past",
      "any.required": "Due date is required",
    }),
    priority: Joi.string()
      .valid("Low", "Medium", "High", "Critical")
      .default("Medium"),
    estimatedHours: Joi.number().min(0.5).max(200).default(1),
    tags: Joi.array().items(Joi.string().max(30)),
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(10).max(1000),
    status: Joi.string().valid("To Do", "In Progress", "Done"),
    priority: Joi.string().valid("Low", "Medium", "High", "Critical"),
    assignedTo: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
    dueDate: Joi.date(),
    estimatedHours: Joi.number().min(0.5).max(200),
    actualHours: Joi.number().min(0),
    tags: Joi.array().items(Joi.string().max(30)),
  }),

  addComment: Joi.object({
    content: Joi.string().min(1).max(500).required().messages({
      "string.min": "Comment cannot be empty",
      "string.max": "Comment cannot exceed 500 characters",
      "any.required": "Comment content is required",
    }),
  }),
};

// Query parameter validation
export const queryValidation = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().default("-createdAt"),
    search: Joi.string().max(100).allow(""),
  }),

  dateRange: Joi.object({
    startDate: Joi.date(),
    endDate: Joi.date().greater(Joi.ref("startDate")),
  }),

  filterByStatus: Joi.object({
    status: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ),
  }),
};

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    req.body = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Query validation error",
        errors,
      });
    }

    // Instead of reassigning req.query, store validated query in a custom property
    req.validatedQuery = value;
    next();
  };
};
