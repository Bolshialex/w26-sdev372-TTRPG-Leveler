import request from "supertest";
import express from "express";

// Import all controllers
import {
  getUsersController,
  getUser,
  createNewUser,
  updateExistingUser,
  deleteExistingUser,
} from "../../controllers/user.controller.js";

// Import all repository functions
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../../repos/users.repo.js";

// 1. Mock the entire repository module
jest.mock("../../repos/users.repo.js", () => ({
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

// 2. Set up a minimal Express app for testing all routes
const app = express();
app.use(express.json());

// Map the routes to their respective controllers
app.get("/api/users", getUsersController);
app.get("/api/users/:id", getUser);
app.post("/api/users", createNewUser);
app.put("/api/users/:id", updateExistingUser);
app.delete("/api/users/:id", deleteExistingUser);

// 3. Reusable mock user data for the single-user operations
const mockDbUser = {
  get: jest.fn().mockReturnValue({
    id: 1,
    user_name: "Alex",
    user_email: "alex@example.com",
    user_password: "supersecretpassword",
  }),
};

describe("User Controllers Test Suite", () => {
  // Clear mocks before each test to ensure a clean slate
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // GET ALL USERS
  // ==========================================
  describe("GET /api/users (getUsersController)", () => {
    it("should return a 200 status and a list of sanitized users (no passwords)", async () => {
      const mockUsersFromDb = [
        {
          get: jest.fn().mockReturnValue({
            id: 1,
            username: "johndoe",
            user_password: "hashed_password_123",
          }),
        },
        {
          get: jest.fn().mockReturnValue({
            id: 2,
            username: "janedoe",
            user_password: "hashed_password_456",
          }),
        },
      ];

      getAllUsers.mockResolvedValue(mockUsersFromDb);

      const response = await request(app).get("/api/users");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toEqual({ id: 1, username: "johndoe" });
      expect(response.body[0]).not.toHaveProperty("user_password");
      expect(getAllUsers).toHaveBeenCalledTimes(1);
    });

    it("should return a 500 status and an error message if the repository throws an error", async () => {
      const dbError = new Error("Database connection failed");
      getAllUsers.mockRejectedValue(dbError);

      const response = await request(app).get("/api/users");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty(
        "error",
        "Database connection failed",
      );
      expect(getAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // GET USER BY ID
  // ==========================================
  describe("GET /api/users/:id (getUser)", () => {
    it("should return 200 and a sanitized user for a valid ID", async () => {
      getUserById.mockResolvedValue(mockDbUser);

      const response = await request(app).get("/api/users/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user_name", "Alex");
      expect(response.body).not.toHaveProperty("user_password");
      expect(getUserById).toHaveBeenCalledWith("1");
    });

    it("should return 400 if the provided ID is not a number", async () => {
      const response = await request(app).get("/api/users/abc");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid user ID");
      expect(getUserById).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // CREATE USER
  // ==========================================
  describe("POST /api/users (createNewUser)", () => {
    it("should return 201 and create a user when given a valid payload", async () => {
      createUser.mockResolvedValue(mockDbUser);

      const payload = {
        user_name: "Alex",
        user_email: "alex@example.com",
        user_password: "supersecretpassword",
      };

      const response = await request(app).post("/api/users").send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user_name", "Alex");
      expect(response.body).not.toHaveProperty("user_password");
      expect(createUser).toHaveBeenCalledWith(payload);
    });

    it("should return 400 if the email format is invalid", async () => {
      const payload = {
        user_name: "Alex",
        user_email: "not-an-email",
        user_password: "supersecretpassword",
      };

      const response = await request(app).post("/api/users").send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid email format");
      expect(createUser).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // UPDATE USER
  // ==========================================
  describe("PUT /api/users/:id (updateExistingUser)", () => {
    it("should return 200 and the updated sanitized user on success", async () => {
      updateUser.mockResolvedValue([1]);
      getUserById.mockResolvedValue(mockDbUser);

      const response = await request(app)
        .put("/api/users/1")
        .send({ user_name: "Alex Updated" });

      expect(response.status).toBe(200);
      expect(updateUser).toHaveBeenCalledWith("1", {
        user_name: "Alex Updated",
      });
      expect(getUserById).toHaveBeenCalledWith("1");
    });

    it("should return 404 if the user is not found (0 rows updated)", async () => {
      updateUser.mockResolvedValue([0]);

      const response = await request(app)
        .put("/api/users/999")
        .send({ user_name: "Nobody" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "error",
        "User not found or no changes made",
      );
      expect(getUserById).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // DELETE USER
  // ==========================================
  describe("DELETE /api/users/:id (deleteExistingUser)", () => {
    it("should return 200 and a success message if deleted successfully", async () => {
      deleteUser.mockResolvedValue(true);

      const response = await request(app).delete("/api/users/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "User deleted successfully",
      );
      expect(deleteUser).toHaveBeenCalledWith("1");
    });

    it("should return 404 if the user to delete is not found", async () => {
      deleteUser.mockResolvedValue(false);

      const response = await request(app).delete("/api/users/999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "User not found");
      expect(deleteUser).toHaveBeenCalledWith("999");
    });
  });
});
