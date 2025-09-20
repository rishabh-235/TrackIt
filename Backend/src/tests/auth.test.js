import request from "supertest";
import mongoose from "mongoose";
import app from "../../app.js";
import { User } from "../../models/index.js";
import { generateToken } from "../../utils/auth.js";

describe("Auth Endpoints", () => {
  let server;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri =
      process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/trackit_test";
    await mongoose.connect(mongoUri);

    server = app.listen(0); // Use random port for testing
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/auth/register", () => {
    const userData = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
      role: "Developer",
    };

    test("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    test("should not register user with existing email", async () => {
      await User.create(userData);

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    test("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: "invalid-email",
          password: "123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    let user;

    beforeEach(async () => {
      user = await User.create({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "Developer",
      });
    });

    test("should login user with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("test@example.com");
      expect(response.body.data.token).toBeDefined();
    });

    test("should not login with invalid password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid");
    });

    test("should not login with non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test("should not login deactivated user", async () => {
      await User.findByIdAndUpdate(user._id, { isActive: false });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("deactivated");
    });
  });

  describe("GET /api/auth/profile", () => {
    let user, token;

    beforeEach(async () => {
      user = await User.create({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "Developer",
      });
      token = generateToken({ id: user._id });
    });

    test("should get user profile with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe("test@example.com");
      expect(response.body.data.password).toBeUndefined();
    });

    test("should not get profile without token", async () => {
      const response = await request(app).get("/api/auth/profile").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("No token");
    });

    test("should not get profile with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid token");
    });
  });

  describe("PUT /api/auth/profile", () => {
    let user, token;

    beforeEach(async () => {
      user = await User.create({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "Developer",
      });
      token = generateToken({ id: user._id });
    });

    test("should update user profile", async () => {
      const updateData = {
        firstName: "Jane",
        lastName: "Smith",
        phone: "+1234567890",
        department: "Engineering",
      };

      const response = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe("Jane");
      expect(response.body.data.lastName).toBe("Smith");
      expect(response.body.data.phone).toBe("+1234567890");
    });

    test("should validate update data", async () => {
      const response = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({
          firstName: "A", // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe("PUT /api/auth/change-password", () => {
    let user, token;

    beforeEach(async () => {
      user = await User.create({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "Developer",
      });
      token = generateToken({ id: user._id });
    });

    test("should change password with valid current password", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "password123",
          newPassword: "newpassword123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("changed successfully");
    });

    test("should not change password with invalid current password", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "wrongpassword",
          newPassword: "newpassword123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("incorrect");
    });

    test("should validate new password length", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "password123",
          newPassword: "123", // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});
