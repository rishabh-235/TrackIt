import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import { User, Project } from "../../models/index.js";
import { generateToken } from "../../utils/auth.js";

describe("Project Endpoints", () => {
  let server;
  let adminUser, managerUser, developerUser;
  let adminToken, managerToken, developerToken;

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
  });

  describe("POST /api/projects", () => {
    const projectData = {
      name: "Test Project",
      description: "This is a test project for our application",
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      priority: "High",
    };

    test("should create project as admin", async () => {
      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...projectData,
          manager: managerUser._id.toString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(projectData.name);
      expect(response.body.data.manager._id).toBe(managerUser._id.toString());
    });

    test("should create project as manager", async () => {
      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          ...projectData,
          manager: managerUser._id.toString(),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(projectData.name);
    });

    test("should not create project as developer", async () => {
      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${developerToken}`)
        .send({
          ...projectData,
          manager: managerUser._id.toString(),
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "A", // Too short
          description: "Short", // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test("should validate date ranges", async () => {
      const response = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          ...projectData,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // End before start
          manager: managerUser._id.toString(),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("GET /api/projects", () => {
    let project1, project2;

    beforeEach(async () => {
      project1 = await Project.create({
        name: "Project 1",
        description: "First test project",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        manager: managerUser._id,
        teamMembers: [{ user: developerUser._id, role: "Developer" }],
      });

      project2 = await Project.create({
        name: "Project 2",
        description: "Second test project",
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        manager: adminUser._id,
      });
    });

    test("should get all projects as admin", async () => {
      const response = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination).toBeDefined();
    });

    test("should get only managed projects as manager", async () => {
      const response = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]._id).toBe(project1._id.toString());
    });

    test("should get only assigned projects as developer", async () => {
      const response = await request(app)
        .get("/api/projects")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]._id).toBe(project1._id.toString());
    });

    test("should support pagination", async () => {
      const response = await request(app)
        .get("/api/projects?page=1&limit=1")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    test("should support search", async () => {
      const response = await request(app)
        .get("/api/projects?search=First")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe("Project 1");
    });
  });

  describe("GET /api/projects/:id", () => {
    let project;

    beforeEach(async () => {
      project = await Project.create({
        name: "Test Project",
        description: "Test project description",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        manager: managerUser._id,
        teamMembers: [{ user: developerUser._id, role: "Developer" }],
      });
    });

    test("should get project by ID as admin", async () => {
      const response = await request(app)
        .get(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(project._id.toString());
      expect(response.body.data.manager).toBeDefined();
      expect(response.body.data.teamMembers).toBeDefined();
    });

    test("should get project as manager who manages it", async () => {
      const response = await request(app)
        .get(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(project._id.toString());
    });

    test("should get project as developer assigned to it", async () => {
      const response = await request(app)
        .get(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(project._id.toString());
    });

    test("should not get project with invalid ID", async () => {
      const response = await request(app)
        .get("/api/projects/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test("should not get non-existent project", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/projects/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/projects/:id", () => {
    let project;

    beforeEach(async () => {
      project = await Project.create({
        name: "Test Project",
        description: "Test project description",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        manager: managerUser._id,
      });
    });

    test("should update project as admin", async () => {
      const updateData = {
        name: "Updated Project",
        status: "In Progress",
        priority: "Critical",
      };

      const response = await request(app)
        .put(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Project");
      expect(response.body.data.status).toBe("In Progress");
      expect(response.body.data.priority).toBe("Critical");
    });

    test("should update project as manager who manages it", async () => {
      const updateData = {
        name: "Updated by Manager",
        status: "In Progress",
      };

      const response = await request(app)
        .put(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated by Manager");
    });

    test("should not update project as developer", async () => {
      const response = await request(app)
        .put(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .send({ name: "Should not update" })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should validate update data", async () => {
      const response = await request(app)
        .put(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "A", // Too short
          status: "Invalid Status",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("POST /api/projects/:id/team-members", () => {
    let project;

    beforeEach(async () => {
      project = await Project.create({
        name: "Test Project",
        description: "Test project description",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        manager: managerUser._id,
      });
    });

    test("should add team member as admin", async () => {
      const response = await request(app)
        .post(`/api/projects/${project._id}/team-members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: developerUser._id.toString(),
          role: "Developer",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teamMembers.length).toBe(1);
      expect(response.body.data.teamMembers[0].user._id).toBe(
        developerUser._id.toString()
      );
    });

    test("should add team member as project manager", async () => {
      const response = await request(app)
        .post(`/api/projects/${project._id}/team-members`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          userId: developerUser._id.toString(),
          role: "Developer",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teamMembers.length).toBe(1);
    });

    test("should not add team member as developer", async () => {
      const response = await request(app)
        .post(`/api/projects/${project._id}/team-members`)
        .set("Authorization", `Bearer ${developerToken}`)
        .send({
          userId: adminUser._id.toString(),
          role: "Developer",
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test("should not add non-existent user", async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/projects/${project._id}/team-members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: fakeUserId.toString(),
          role: "Developer",
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("User not found");
    });

    test("should not add duplicate team member", async () => {
      // Add user first time
      await request(app)
        .post(`/api/projects/${project._id}/team-members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: developerUser._id.toString(),
          role: "Developer",
        })
        .expect(200);

      // Try to add same user again
      const response = await request(app)
        .post(`/api/projects/${project._id}/team-members`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          userId: developerUser._id.toString(),
          role: "Developer",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already a team member");
    });
  });

  describe("DELETE /api/projects/:id/team-members/:userId", () => {
    let project;

    beforeEach(async () => {
      project = await Project.create({
        name: "Test Project",
        description: "Test project description",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        manager: managerUser._id,
        teamMembers: [{ user: developerUser._id, role: "Developer" }],
      });
    });

    test("should remove team member as admin", async () => {
      const response = await request(app)
        .delete(
          `/api/projects/${project._id}/team-members/${developerUser._id}`
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teamMembers.length).toBe(0);
    });

    test("should remove team member as project manager", async () => {
      const response = await request(app)
        .delete(
          `/api/projects/${project._id}/team-members/${developerUser._id}`
        )
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.teamMembers.length).toBe(0);
    });

    test("should not remove team member as developer", async () => {
      const response = await request(app)
        .delete(
          `/api/projects/${project._id}/team-members/${developerUser._id}`
        )
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/projects/:id", () => {
    let project;

    beforeEach(async () => {
      project = await Project.create({
        name: "Test Project",
        description: "Test project description",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        manager: managerUser._id,
      });
    });

    test("should delete project as admin", async () => {
      const response = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully");

      // Verify project is deleted
      const deletedProject = await Project.findById(project._id);
      expect(deletedProject).toBeNull();
    });

    test("should not delete project as manager", async () => {
      const response = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test("should not delete project as developer", async () => {
      const response = await request(app)
        .delete(`/api/projects/${project._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
