import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import { User, Project, Task } from "../../models/index.js";
import { generateToken } from "../../utils/auth.js";

describe("Task Endpoints", () => {
  let server;
  let adminUser, managerUser, developerUser, otherDeveloperUser;
  let adminToken, managerToken, developerToken, otherDeveloperToken;
  let project, otherProject;

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

    otherDeveloperUser = await User.create({
      email: "other@example.com",
      password: "password123",
      firstName: "Other",
      lastName: "Developer",
      role: "Developer",
    });

    // Generate tokens
    adminToken = generateToken({ id: adminUser._id });
    managerToken = generateToken({ id: managerUser._id });
    developerToken = generateToken({ id: developerUser._id });
    otherDeveloperToken = generateToken({ id: otherDeveloperUser._id });

    // Create test projects
    project = await Project.create({
      name: "Test Project",
      description: "Test project description",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      manager: managerUser._id,
      teamMembers: [
        { user: developerUser._id, role: "Developer" },
        { user: otherDeveloperUser._id, role: "Developer" },
      ],
    });

    otherProject = await Project.create({
      name: "Other Project",
      description: "Other project description",
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      manager: adminUser._id,
      teamMembers: [{ user: adminUser._id, role: "Manager" }],
    });
  });

  describe("POST /api/tasks", () => {
    const taskData = {
      title: "Test Task",
      description: "This is a test task for our application",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: "High",
      estimatedHours: 8,
      tags: ["frontend", "urgent"],
    };

    test("should create task as admin", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...taskData,
          assignedTo: developerUser._id.toString(),
          project: project._id.toString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.assignedTo._id).toBe(
        developerUser._id.toString()
      );
      expect(response.body.data.project._id).toBe(project._id.toString());
      expect(response.body.data.createdBy._id).toBe(adminUser._id.toString());
    });

    test("should create task as project manager", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          ...taskData,
          assignedTo: developerUser._id.toString(),
          project: project._id.toString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
    });

    test("should create task as team member", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${developerToken}`)
        .send({
          ...taskData,
          assignedTo: otherDeveloperUser._id.toString(),
          project: project._id.toString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
    });

    test("should not create task for project user is not part of", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${developerToken}`)
        .send({
          ...taskData,
          assignedTo: adminUser._id.toString(),
          project: otherProject._id.toString(),
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should not assign task to user not in project", async () => {
      // Create a user not in the project
      const outsideUser = await User.create({
        email: "outside@example.com",
        password: "password123",
        firstName: "Outside",
        lastName: "User",
        role: "Developer",
      });

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...taskData,
          assignedTo: outsideUser._id.toString(),
          project: project._id.toString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not part of the project");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "A", // Too short
          description: "Short", // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test("should not allow due date in the past", async () => {
      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...taskData,
          dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          assignedTo: developerUser._id.toString(),
          project: project._id.toString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /api/tasks", () => {
    let task1, task2, task3;

    beforeEach(async () => {
      task1 = await Task.create({
        title: "Task 1",
        description: "First test task",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "To Do",
      });

      task2 = await Task.create({
        title: "Task 2",
        description: "Second test task",
        assignedTo: otherDeveloperUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: "In Progress",
      });

      task3 = await Task.create({
        title: "Task 3",
        description: "Third test task in other project",
        assignedTo: adminUser._id,
        project: otherProject._id,
        createdBy: adminUser._id,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        status: "Done",
      });
    });

    test("should get all tasks as admin", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination).toBeDefined();
    });

    test("should get only managed project tasks as manager", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(
        response.body.data.every(
          (task) => task.project._id === project._id.toString()
        )
      ).toBe(true);
    });

    test("should get only assigned tasks as developer", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]._id).toBe(task1._id.toString());
    });

    test("should support status filtering", async () => {
      const response = await request(app)
        .get("/api/tasks?status=In Progress")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe("In Progress");
    });

    test("should support priority filtering", async () => {
      // Update a task to have high priority
      await Task.findByIdAndUpdate(task1._id, { priority: "High" });

      const response = await request(app)
        .get("/api/tasks?priority=High")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].priority).toBe("High");
    });

    test("should support project filtering", async () => {
      const response = await request(app)
        .get(`/api/tasks?project=${project._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(
        response.body.data.every(
          (task) => task.project._id === project._id.toString()
        )
      ).toBe(true);
    });

    test("should support search functionality", async () => {
      const response = await request(app)
        .get("/api/tasks?search=First")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe("Task 1");
    });

    test("should support pagination", async () => {
      const response = await request(app)
        .get("/api/tasks?page=1&limit=1")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(3);
    });
  });

  describe("GET /api/tasks/:id", () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({
        title: "Test Task",
        description: "Test task description",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    test("should get task by ID as admin", async () => {
      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(task._id.toString());
      expect(response.body.data.assignedTo).toBeDefined();
      expect(response.body.data.project).toBeDefined();
      expect(response.body.data.createdBy).toBeDefined();
    });

    test("should get task as project manager", async () => {
      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(task._id.toString());
    });

    test("should get task as assigned user", async () => {
      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(task._id.toString());
    });

    test("should not get task as unassigned developer", async () => {
      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${otherDeveloperToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should not get task with invalid ID", async () => {
      const response = await request(app)
        .get("/api/tasks/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/tasks/:id", () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({
        title: "Test Task",
        description: "Test task description",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "To Do",
        actualHours: 0,
      });
    });

    test("should update task as admin", async () => {
      const updateData = {
        title: "Updated Task",
        status: "In Progress",
        priority: "Critical",
        actualHours: 4,
      };

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated Task");
      expect(response.body.data.status).toBe("In Progress");
      expect(response.body.data.priority).toBe("Critical");
      expect(response.body.data.actualHours).toBe(4);
    });

    test("should update task as project manager", async () => {
      const updateData = {
        title: "Updated by Manager",
        status: "In Progress",
      };

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated by Manager");
    });

    test("should update only status and actual hours as assigned developer", async () => {
      const updateData = {
        status: "In Progress",
        actualHours: 3,
      };

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("In Progress");
      expect(response.body.data.actualHours).toBe(3);
    });

    test("should not allow developer to update restricted fields", async () => {
      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .send({
          title: "Should not update",
          priority: "High",
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Developers can only update");
    });

    test("should not update task as unassigned developer", async () => {
      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${otherDeveloperToken}`)
        .send({ status: "Done" })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should validate assignedTo user is in project when reassigning", async () => {
      // Create user not in project
      const outsideUser = await User.create({
        email: "outside@example.com",
        password: "password123",
        firstName: "Outside",
        lastName: "User",
        role: "Developer",
      });

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          assignedTo: outsideUser._id.toString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not part of the project");
    });

    test("should set completedAt when status changes to Done", async () => {
      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Done" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("Done");
      expect(response.body.data.completedAt).toBeDefined();
    });
  });

  describe("POST /api/tasks/:id/comments", () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({
        title: "Test Task",
        description: "Test task description",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    test("should add comment as assigned user", async () => {
      const commentData = {
        content: "This is a test comment on the task",
      };

      const response = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set("Authorization", `Bearer ${developerToken}`)
        .send(commentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments.length).toBe(1);
      expect(response.body.data.comments[0].content).toBe(commentData.content);
      expect(response.body.data.comments[0].user._id).toBe(
        developerUser._id.toString()
      );
    });

    test("should add comment as project manager", async () => {
      const commentData = {
        content: "Manager comment on the task",
      };

      const response = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send(commentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments.length).toBe(1);
      expect(response.body.data.comments[0].content).toBe(commentData.content);
    });

    test("should add comment as admin", async () => {
      const commentData = {
        content: "Admin comment on the task",
      };

      const response = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(commentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments.length).toBe(1);
    });

    test("should not add comment as unassigned developer", async () => {
      const response = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set("Authorization", `Bearer ${otherDeveloperToken}`)
        .send({ content: "Should not work" })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should validate comment content", async () => {
      const response = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set("Authorization", `Bearer ${developerToken}`)
        .send({ content: "" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test("should not allow comment content longer than 500 characters", async () => {
      const longContent = "a".repeat(501);

      const response = await request(app)
        .post(`/api/tasks/${task._id}/comments`)
        .set("Authorization", `Bearer ${developerToken}`)
        .send({ content: longContent })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /api/tasks/my-tasks", () => {
    beforeEach(async () => {
      await Task.create({
        title: "My Task 1",
        description: "First task assigned to me",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "To Do",
      });

      await Task.create({
        title: "My Task 2",
        description: "Second task assigned to me",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: "In Progress",
      });

      await Task.create({
        title: "Other Task",
        description: "Task assigned to someone else",
        assignedTo: otherDeveloperUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        status: "To Do",
      });
    });

    test("should get only tasks assigned to current user", async () => {
      const response = await request(app)
        .get("/api/tasks/my-tasks")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(
        response.body.data.every(
          (task) => task.assignedTo.toString() === developerUser._id.toString()
        )
      ).toBe(true);
    });

    test("should support status filtering for my tasks", async () => {
      const response = await request(app)
        .get("/api/tasks/my-tasks?status=To Do")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe("To Do");
    });

    test("should support pagination for my tasks", async () => {
      const response = await request(app)
        .get("/api/tasks/my-tasks?page=1&limit=1")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe("GET /api/tasks/overdue", () => {
    beforeEach(async () => {
      // Create overdue task
      await Task.create({
        title: "Overdue Task",
        description: "This task is overdue",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        status: "In Progress",
      });

      // Create completed overdue task (should not appear)
      await Task.create({
        title: "Completed Overdue Task",
        description: "This task was overdue but completed",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() - 48 * 60 * 60 * 1000), // Two days ago
        status: "Done",
      });

      // Create future task (should not appear)
      await Task.create({
        title: "Future Task",
        description: "This task is due in the future",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: "To Do",
      });
    });

    test("should get overdue tasks as developer", async () => {
      const response = await request(app)
        .get("/api/tasks/overdue")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe("Overdue Task");
      expect(new Date(response.body.data[0].dueDate)).toBeLessThan(new Date());
      expect(response.body.data[0].status).not.toBe("Done");
    });

    test("should get overdue tasks from managed projects as manager", async () => {
      const response = await request(app)
        .get("/api/tasks/overdue")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe("Overdue Task");
    });

    test("should get all overdue tasks as admin", async () => {
      // Create overdue task in other project
      await Task.create({
        title: "Another Overdue Task",
        description: "Overdue task in another project",
        assignedTo: adminUser._id,
        project: otherProject._id,
        createdBy: adminUser._id,
        dueDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        status: "To Do",
      });

      const response = await request(app)
        .get("/api/tasks/overdue")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    let task;

    beforeEach(async () => {
      task = await Task.create({
        title: "Test Task",
        description: "Test task description",
        assignedTo: developerUser._id,
        project: project._id,
        createdBy: managerUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    test("should delete task as admin", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully");

      // Verify task is deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    test("should delete task as project manager", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test("should not delete task as developer", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should not delete non-existent task", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });
});
