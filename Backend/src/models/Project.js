import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
      maxlength: [500, "Project description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: {
        values: [
          "Planning",
          "In Progress",
          "Completed",
          "On Hold",
          "Cancelled",
        ],
        message:
          "Status must be one of: Planning, In Progress, Completed, On Hold, Cancelled",
      },
      default: "Planning",
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High", "Critical"],
        message: "Priority must be one of: Low, Medium, High, Critical",
      },
      default: "Medium",
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project manager is required"],
    },
    teamMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["Manager", "Developer", "Designer", "Tester"],
          default: "Developer",
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    budget: {
      type: Number,
      min: [0, "Budget cannot be negative"],
      default: 0,
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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
projectSchema.index({ manager: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ "teamMembers.user": 1 });
projectSchema.index({ startDate: 1, endDate: 1 });

// Virtual for project duration in days
projectSchema.virtual("durationInDays").get(function () {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual to check if project is overdue
projectSchema.virtual("isOverdue").get(function () {
  return this.endDate < new Date() && this.status !== "Completed";
});

// Virtual for days remaining
projectSchema.virtual("daysRemaining").get(function () {
  if (this.endDate && this.status !== "Completed") {
    const diffTime = this.endDate - new Date();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysRemaining > 0 ? daysRemaining : 0;
  }
  return 0;
});

// Method to add team member
projectSchema.methods.addTeamMember = function (userId, role = "Developer") {
  const existingMember = this.teamMembers.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (!existingMember) {
    this.teamMembers.push({
      user: userId,
      role: role,
      assignedDate: new Date(),
    });
  }
  return this;
};

// Method to remove team member
projectSchema.methods.removeTeamMember = function (userId) {
  this.teamMembers = this.teamMembers.filter(
    (member) => member.user.toString() !== userId.toString()
  );
  return this;
};

export default mongoose.model("Project", projectSchema);
