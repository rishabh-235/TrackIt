import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: [true, "Comment content is required"],
    trim: true,
    maxlength: [500, "Comment cannot exceed 500 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Task title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
      maxlength: [1000, "Task description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["To Do", "In Progress", "Done"],
        message: "Status must be one of: To Do, In Progress, Done",
      },
      default: "To Do",
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High", "Critical"],
        message: "Priority must be one of: Low, Medium, High, Critical",
      },
      default: "Medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must be assigned to a user"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Task must belong to a project"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task creator is required"],
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
      validate: {
        validator: function (value) {
          return value >= new Date();
        },
        message: "Due date cannot be in the past",
      },
    },
    estimatedHours: {
      type: Number,
      min: [0.5, "Estimated hours must be at least 0.5"],
      max: [200, "Estimated hours cannot exceed 200"],
      default: 1,
    },
    actualHours: {
      type: Number,
      min: [0, "Actual hours cannot be negative"],
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    comments: [commentSchema],
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    completedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdBy: 1 });

// Virtual to check if task is overdue
taskSchema.virtual("isOverdue").get(function () {
  return this.dueDate < new Date() && this.status !== "Done";
});

// Virtual for days remaining
taskSchema.virtual("daysRemaining").get(function () {
  if (this.dueDate && this.status !== "Done") {
    const diffTime = this.dueDate - new Date();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysRemaining;
  }
  return 0;
});

// Virtual for completion percentage based on actual vs estimated hours
taskSchema.virtual("progressPercentage").get(function () {
  if (this.status === "Done") return 100;
  if (this.estimatedHours === 0) return 0;
  return Math.min(
    Math.round((this.actualHours / this.estimatedHours) * 100),
    100
  );
});

// Pre-save middleware to set completedAt when status changes to Done
taskSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "Done" && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== "Done") {
      this.completedAt = null;
    }
  }
  next();
});

// Method to add comment
taskSchema.methods.addComment = function (userId, content) {
  this.comments.push({
    user: userId,
    content: content,
    createdAt: new Date(),
  });
  return this;
};

// Method to add attachment
taskSchema.methods.addAttachment = function (fileName, fileUrl, uploadedBy) {
  this.attachments.push({
    fileName,
    fileUrl,
    uploadedBy,
    uploadedAt: new Date(),
  });
  return this;
};

export default mongoose.model("Task", taskSchema);
