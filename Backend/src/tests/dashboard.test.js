import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import { User, Project, Task } from "../../models/index.js";
import { generateToken } from "../../utils/auth.js";

describe("Dashboard Endpoints", () => {
  let server;
  let adminUser, managerUser, developerUser;
  let adminToken, managerToken, developerToken;
  let project1, project2;
  let task1, task2, task3, overdueTask;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/trackit_test";
    await mongoose.connect(mongoUri);
    server = app.listen(0);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    // Create test users
    adminUser = await User.create({
      email: "admin@example.com",
      password: "password123",
      firstName: "Admin",
      lastName: "User",
      role: "Admin",
    });

    managerUser = await User.create({
      email: "manager@example.com",
      password: "password123",
      firstName: "Manager",
      lastName: "User",
      role: "Manager",
    });

    developerUser = await User.create({
      email: "developer@example.com",
      password: "password123",
      firstName: "Developer",
      lastName: "User",
      role: "Developer",
    });

    // Generate tokens
    adminToken = generateToken({ id: adminUser._id });
    managerToken = generateToken({ id: managerUser._id });
    developerToken = generateToken({ id: developerUser._id });

    // Create test projects
    project1 = await Project.create({
      name: "Project 1",
      description: "First test project",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      manager: managerUser._id,
      status: "In Progress",
      teamMembers: [{ user: developerUser._id, role: "Developer" }],
    });

    project2 = await Project.create({
      name: "Project 2",
      description: "Second test project",
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      manager: adminUser._id,
      status: "Planning",
      teamMembers: [{ user: adminUser._id, role: "Manager" }],
    });

    // Create test tasks
    task1 = await Task.create({
      title: "Task 1",
      description: "First test task",
      assignedTo: developerUser._id,
      project: project1._id,
      createdBy: managerUser._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "To Do",
      priority: "High",
      estimatedHours: 8,
      actualHours: 0,
    });

    task2 = await Task.create({
      title: "Task 2",
      description: "Second test task",
      assignedTo: developerUser._id,
      project: project1._id,
      createdBy: managerUser._id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: "In Progress",
      priority: "Medium",
      estimatedHours: 12,
      actualHours: 6,
    });

    task3 = await Task.create({
      title: "Task 3",
      description: "Third test task",
      assignedTo: adminUser._id,
      project: project2._id,
      createdBy: adminUser._id,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: "Done",
      priority: "Low",
      estimatedHours: 4,
      actualHours: 5,
      completedAt: new Date(),
    });

    // Create overdue task
    overdueTask = await Task.create({
      title: "Overdue Task",
      description: "This task is overdue",
      assignedTo: developerUser._id,
      project: project1._id,
      createdBy: managerUser._id,
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      status: "In Progress",
      priority: "Critical",
    });
  });

  describe("GET /api/dashboard", () => {
    test("should get comprehensive dashboard data as admin", async () => {
      const response = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Check if all expected sections are present
      expect(response.body.data.userStats).toBeDefined();
      expect(response.body.data.projectStats).toBeDefined();
      expect(response.body.data.taskStats).toBeDefined();
      expect(response.body.data.recentActivities).toBeDefined();
      expect(response.body.data.overdueItems).toBeDefined();
      expect(response.body.data.upcomingDeadlines).toBeDefined();
      expect(response.body.data.systemStats).toBeDefined(); // Admin only
      expect(response.body.data.teamStats).toBeDefined(); // Admin only

      // Check user stats (admin can see all users)
      expect(response.body.data.userStats[0].totalUsers).toBe(3);
      expect(response.body.data.userStats[0].activeUsers).toBe(3);

      // Check system stats (admin only)
      expect(response.body.data.systemStats.totalUsers).toBe(3);
      expect(response.body.data.systemStats.totalProjects).toBe(2);
      expect(response.body.data.systemStats.totalTasks).toBe(4);
    });

    test("should get dashboard data as manager", async () => {
      const response = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Manager should not see user stats or system stats
      expect(response.body.data.userStats).toBeNull();
      expect(response.body.data.systemStats).toBeUndefined();

      // But should see team stats and project/task stats for managed projects
      expect(response.body.data.teamStats).toBeDefined();
      expect(response.body.data.projectStats).toBeDefined();
      expect(response.body.data.taskStats).toBeDefined();

      // Check that manager only sees their managed projects in stats
      expect(response.body.data.projectStats[0].totalProjects).toBe(1);
      expect(response.body.data.taskStats[0].totalTasks).toBe(3); // 3 tasks in project1
    });

    test("should get dashboard data as developer", async () => {
      const response = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Developer should not see user stats, system stats, or team stats
      expect(response.body.data.userStats).toBeNull();
      expect(response.body.data.systemStats).toBeUndefined();
      expect(response.body.data.teamStats).toBeUndefined();

      // But should see their own task and project stats
      expect(response.body.data.projectStats).toBeDefined();
      expect(response.body.data.taskStats).toBeDefined();

      // Check that developer only sees their assigned tasks
      expect(response.body.data.taskStats[0].totalTasks).toBe(3); // 3 tasks assigned to developer
    });

    test("should include overdue items in dashboard", async () => {
      const response = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overdueItems).toBeDefined();
      expect(response.body.data.overdueItems.tasks).toBeDefined();
      expect(response.body.data.overdueItems.projects).toBeDefined();

      // Should find the overdue task
      expect(response.body.data.overdueItems.tasks.length).toBe(1);
      expect(response.body.data.overdueItems.tasks[0].title).toBe(
        "Overdue Task"
      );
    });

    test("should include upcoming deadlines in dashboard", async () => {
      const response = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.upcomingDeadlines).toBeDefined();
      expect(response.body.data.upcomingDeadlines.tasks).toBeDefined();
      expect(response.body.data.upcomingDeadlines.projects).toBeDefined();

      // Should find upcoming tasks (within 7 days)
      expect(response.body.data.upcomingDeadlines.tasks.length).toBeGreaterThan(
        0
      );
    });

    test("should include recent activities in dashboard", async () => {
      const response = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recentActivities).toBeDefined();
      expect(Array.isArray(response.body.data.recentActivities)).toBe(true);
      expect(response.body.data.recentActivities.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/dashboard/analytics", () => {
    test("should get analytics data as admin", async () => {
      const response = await request(app)
        .get("/api/dashboard/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.period).toBe("30d");
      expect(response.body.data.startDate).toBeDefined();
      expect(response.body.data.endDate).toBeDefined();
      expect(response.body.data.projectTrends).toBeDefined();
      expect(response.body.data.taskTrends).toBeDefined();
      expect(response.body.data.performanceMetrics).toBeDefined();
    });

    test("should get analytics data as manager", async () => {
      const response = await request(app)
        .get("/api/dashboard/analytics")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      // Manager should only see analytics for their managed projects
      expect(response.body.data.projectTrends).toBeDefined();
      expect(response.body.data.taskTrends).toBeDefined();
    });

    test("should not allow developer to access analytics", async () => {
      const response = await request(app)
        .get("/api/dashboard/analytics")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should support different time periods", async () => {
      const response = await request(app)
        .get("/api/dashboard/analytics?period=7d")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.period).toBe("7d");

      // Check that start date is 7 days ago
      const startDate = new Date(response.body.data.startDate);
      const expectedStartDate = new Date();
      expectedStartDate.setDate(expectedStartDate.getDate() - 7);

      expect(startDate.toDateString()).toBe(expectedStartDate.toDateString());
    });

    test("should include performance metrics in analytics", async () => {
      const response = await request(app)
        .get("/api/dashboard/analytics")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.performanceMetrics).toBeDefined();
      expect(response.body.data.performanceMetrics.taskCount).toBeDefined();
      expect(
        response.body.data.performanceMetrics.completedTasks
      ).toBeDefined();
      expect(
        response.body.data.performanceMetrics.completionRate
      ).toBeDefined();
      expect(
        response.body.data.performanceMetrics.totalEstimatedHours
      ).toBeDefined();
      expect(
        response.body.data.performanceMetrics.totalActualHours
      ).toBeDefined();
    });
  });

  describe("GET /api/dashboard/team-performance", () => {
    test("should get team performance data as admin", async () => {
      const response = await request(app)
        .get("/api/dashboard/team-performance")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      if (response.body.data.length > 0) {
        const teamMember = response.body.data[0];
        expect(teamMember.user).toBeDefined();
        expect(teamMember.totalTasks).toBeDefined();
        expect(teamMember.completedTasks).toBeDefined();
        expect(teamMember.inProgressTasks).toBeDefined();
        expect(teamMember.overdueTasks).toBeDefined();
        expect(teamMember.completionRate).toBeDefined();
        expect(teamMember.efficiency).toBeDefined();
      }
    });

    test("should get team performance data as manager for managed projects", async () => {
      const response = await request(app)
        .get("/api/dashboard/team-performance")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Manager should only see team members from their managed projects
      if (response.body.data.length > 0) {
        const teamMember = response.body.data[0];
        expect(teamMember.user._id).toBe(developerUser._id.toString());
      }
    });

    test("should not allow developer to access team performance", async () => {
      const response = await request(app)
        .get("/api/dashboard/team-performance")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should calculate completion rates correctly", async () => {
      const response = await request(app)
        .get("/api/dashboard/team-performance")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      if (response.body.data.length > 0) {
        const developer = response.body.data.find(
          (member) => member.user._id === developerUser._id.toString()
        );

        if (developer) {
          expect(developer.totalTasks).toBe(3); // 3 tasks assigned to developer
          expect(developer.completedTasks).toBe(0); // None completed yet
          expect(developer.completionRate).toBe(0);
          expect(developer.overdueTasks).toBe(1); // 1 overdue task
        }
      }
    });

    test("should calculate efficiency correctly", async () => {
      const response = await request(app)
        .get("/api/dashboard/team-performance")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      if (response.body.data.length > 0) {
        const developer = response.body.data.find(
          (member) => member.user._id === developerUser._id.toString()
        );

        if (developer) {
          expect(developer.totalEstimatedHours).toBe(20); // 8 + 12 hours
          expect(developer.totalActualHours).toBe(6); // Only task2 has actual hours
          // Efficiency = actual/estimated = 6/20 = 0.3
          expect(developer.efficiency).toBeCloseTo(0.3, 1);
        }
      }
    });

    test("should sort team members by completion rate", async () => {
      // Create a task and mark it as done for admin user
      await Task.findByIdAndUpdate(task3._id, {
        status: "Done",
        completedAt: new Date(),
      });

      const response = await request(app)
        .get("/api/dashboard/team-performance")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      if (response.body.data.length > 1) {
        // Should be sorted by completion rate descending
        for (let i = 0; i < response.body.data.length - 1; i++) {
          expect(response.body.data[i].completionRate).toBeGreaterThanOrEqual(
            response.body.data[i + 1].completionRate
          );
        }
      }
    });
  });

  describe("Dashboard Authentication", () => {
    test("should require authentication for dashboard endpoints", async () => {
      const endpoints = [
        "/api/dashboard",
        "/api/dashboard/analytics",
        "/api/dashboard/team-performance",
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint).expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("No token");
      }
    });

    test("should reject invalid tokens for dashboard endpoints", async () => {
      const endpoints = [
        "/api/dashboard",
        "/api/dashboard/analytics",
        "/api/dashboard/team-performance",
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set("Authorization", "Bearer invalid-token")
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Invalid token");
      }
    });
  });
});
