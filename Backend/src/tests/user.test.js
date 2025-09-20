import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import { User } from "../../models/index.js";
import { generateToken } from "../../utils/auth.js";

describe("User Management Endpoints", () => {
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

  describe("GET /api/users", () => {
    test("should get all users as admin", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.pagination).toBeDefined();
    });

    test("should get all users as manager", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
    });

    test("should not allow developer to get all users", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should support pagination", async () => {
      const response = await request(app)
        .get("/api/users?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    test("should support role filtering", async () => {
      const response = await request(app)
        .get("/api/users?role=Admin")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].role).toBe("Admin");
    });

    test("should support search functionality", async () => {
      const response = await request(app)
        .get("/api/users?search=admin")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].email).toBe("admin@example.com");
    });

    test("should not include passwords in response", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((user) => {
        expect(user.password).toBeUndefined();
      });
    });
  });

  describe("GET /api/users/:id", () => {
    test("should get user by ID as admin", async () => {
      const response = await request(app)
        .get(`/api/users/${developerUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(developerUser._id.toString());
      expect(response.body.data.password).toBeUndefined();
    });

    test("should get user by ID as manager", async () => {
      const response = await request(app)
        .get(`/api/users/${developerUser._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(developerUser._id.toString());
    });

    test("should get own profile as developer", async () => {
      const response = await request(app)
        .get(`/api/users/${developerUser._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(developerUser._id.toString());
    });

    test("should not get other user profile as developer", async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Access denied");
    });

    test("should return 404 for non-existent user", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("PUT /api/users/:id", () => {
    test("should update user as admin", async () => {
      const updateData = {
        firstName: "Updated",
        lastName: "Name",
        phone: "+1234567890",
        department: "Engineering",
        isActive: false,
      };

      const response = await request(app)
        .put(`/api/users/${developerUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe("Updated");
      expect(response.body.data.lastName).toBe("Name");
      expect(response.body.data.phone).toBe("+1234567890");
      expect(response.body.data.department).toBe("Engineering");
      expect(response.body.data.isActive).toBe(false);
    });

    test("should not update user as manager", async () => {
      const response = await request(app)
        .put(`/api/users/${developerUser._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ firstName: "Should not update" })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test("should not update user as developer", async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .send({ firstName: "Should not update" })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test("should validate update data", async () => {
      const response = await request(app)
        .put(`/api/users/${developerUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          firstName: "A", // Too short
          phone: "invalid-phone",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("PUT /api/users/:id/role", () => {
    test("should update user role as admin", async () => {
      const response = await request(app)
        .put(`/api/users/${developerUser._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "Manager" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe("Manager");
    });

    test("should not update role as manager", async () => {
      const response = await request(app)
        .put(`/api/users/${developerUser._id}/role`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ role: "Admin" })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test("should validate role value", async () => {
      const response = await request(app)
        .put(`/api/users/${developerUser._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "InvalidRole" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("PUT /api/users/:id/deactivate", () => {
    test("should deactivate user as admin", async () => {
      const response = await request(app)
        .put(`/api/users/${developerUser._id}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    test("should not deactivate own account", async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser._id}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        "cannot deactivate your own account"
      );
    });

    test("should not deactivate user as manager", async () => {
      const response = await request(app)
        .put(`/api/users/${developerUser._id}/deactivate`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/users/:id/activate", () => {
    beforeEach(async () => {
      // Deactivate developer user first
      await User.findByIdAndUpdate(developerUser._id, { isActive: false });
    });

    test("should activate user as admin", async () => {
      const response = await request(app)
        .put(`/api/users/${developerUser._id}/activate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
    });

    test("should not activate user as manager", async () => {
      const response = await request(app)
        .put(`/api/users/${developerUser._id}/activate`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/users/:id", () => {
    test("should delete user as admin", async () => {
      const response = await request(app)
        .delete(`/api/users/${developerUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully");

      // Verify user is deleted
      const deletedUser = await User.findById(developerUser._id);
      expect(deletedUser).toBeNull();
    });

    test("should not delete own account", async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("cannot delete your own account");
    });

    test("should not delete user as manager", async () => {
      const response = await request(app)
        .delete(`/api/users/${developerUser._id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test("should not delete user as developer", async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/users/stats", () => {
    test("should get user statistics as admin", async () => {
      const response = await request(app)
        .get("/api/users/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.general).toBeDefined();
      expect(response.body.data.byRole).toBeDefined();
      expect(response.body.data.general.totalUsers).toBe(3);
      expect(response.body.data.general.activeUsers).toBe(3);
    });

    test("should get user statistics as manager", async () => {
      const response = await request(app)
        .get("/api/users/stats")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test("should not get user statistics as developer", async () => {
      const response = await request(app)
        .get("/api/users/stats")
        .set("Authorization", `Bearer ${developerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test("should show correct role distribution", async () => {
      const response = await request(app)
        .get("/api/users/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.byRole).toHaveLength(3);

      const roleStats = response.body.data.byRole;
      const adminCount = roleStats.find((stat) => stat.role === "Admin")?.count;
      const managerCount = roleStats.find(
        (stat) => stat.role === "Manager"
      )?.count;
      const developerCount = roleStats.find(
        (stat) => stat.role === "Developer"
      )?.count;

      expect(adminCount).toBe(1);
      expect(managerCount).toBe(1);
      expect(developerCount).toBe(1);
    });
  });

  describe("User Management Authentication", () => {
    test("should require authentication for all user endpoints", async () => {
      const endpoints = [
        "/api/users",
        `/api/users/${developerUser._id}`,
        "/api/users/stats",
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint).expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("No token");
      }
    });

    test("should reject invalid tokens", async () => {
      const response = await request(app)
        .get("/api/users")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid token");
    });
  });
});
