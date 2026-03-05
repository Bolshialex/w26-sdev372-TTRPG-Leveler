import request from "supertest";
import express from "express";

// Import all character controllers
import {
  createCharacterController,
  getCharacterByCharacterId,
  getAllCharactersByUserId,
  updateCharacterController,
  deleteCharacterController,
} from "../../controllers/characters.controller.js"; // Adjust path as needed

// Import the repository functions (noting the alias used in your controller)
import {
  createCharacter,
  findCharacterById,
  findAllCharactersByUserId,
  updateCharacter,
  deleteCharacter,
} from "../../repos/characters.repo.js"; // Adjust path as needed

// 1. Mock the repository module
// Note: We mock the ORIGINAL exported name (findCharacterById)
jest.mock("../../repos/characters.repo.js", () => ({
  createCharacter: jest.fn(),
  findCharacterById: jest.fn(),
  findAllCharactersByUserId: jest.fn(),
  updateCharacter: jest.fn(),
  deleteCharacter: jest.fn(),
}));

// 2. Set up the minimal Express app
const app = express();
app.use(express.json());

// Set up routes matching the req.params expected in your controllers
app.post("/api/characters", createCharacterController);
app.get("/api/characters/:charId", getCharacterByCharacterId);
app.get("/api/users/:userId/characters", getAllCharactersByUserId);
app.put("/api/characters/:id", updateCharacterController);
app.delete("/api/characters/:id", deleteCharacterController);

// 3. Reusable mock character data
const mockCharacter = {
  id: 1,
  user_id: 1,
  char_name: "Grog Strongjaw",
  total_level: 5,
  strength: 18,
};

describe("Character Controllers Test Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/characters (createCharacterController)", () => {
    it("should return 201 and create a character with valid data", async () => {
      createCharacter.mockResolvedValue(mockCharacter);

      const payload = {
        user_id: 1,
        char_name: "Grog Strongjaw",
        total_level: 5,
      };

      const response = await request(app).post("/api/characters").send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("char_name", "Grog Strongjaw");
      expect(createCharacter).toHaveBeenCalledWith(payload);
    });

    it("should return 400 if required fields are missing", async () => {
      const payload = {
        total_level: 5, // Missing user_id and char_name
      };

      const response = await request(app).post("/api/characters").send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Missing required fields");
      expect(createCharacter).not.toHaveBeenCalled();
    });

    it("should return 400 if a field has an invalid data type", async () => {
      const payload = {
        user_id: 1,
        char_name: "Grog",
        total_level: "five", // Should be a number according to schema
      };

      const response = await request(app).post("/api/characters").send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(
        "Invalid data types for fields: total_level",
      );
      expect(createCharacter).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/characters/:charId (getCharacterByCharacterId)", () => {
    it("should return 200 and the character if found", async () => {
      findCharacterById.mockResolvedValue(mockCharacter);

      const response = await request(app).get("/api/characters/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("char_name", "Grog Strongjaw");
      expect(findCharacterById).toHaveBeenCalledWith("1");
    });

    it("should return 400 if the character ID is not a number", async () => {
      const response = await request(app).get("/api/characters/abc");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid character ID");
      expect(findCharacterById).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/users/:userId/characters (getAllCharactersByUserId)", () => {
    it("should return 200 and an array of characters for a valid user ID", async () => {
      findAllCharactersByUserId.mockResolvedValue([mockCharacter]);

      const response = await request(app).get("/api/users/1/characters");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("char_name", "Grog Strongjaw");
      expect(findAllCharactersByUserId).toHaveBeenCalledWith("1");
    });

    it("should return 400 if the user ID is not a number", async () => {
      const response = await request(app).get("/api/users/abc/characters");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid user ID");
      expect(findAllCharactersByUserId).not.toHaveBeenCalled();
    });
  });

  describe("PUT /api/characters/:id (updateCharacterController)", () => {
    it("should return 200 and the updated character on success", async () => {
      // Mock update to succeed (return value doesn't matter much since controller ignores it)
      updateCharacter.mockResolvedValue();
      // Mock the subsequent fetch
      findCharacterById.mockResolvedValue({ ...mockCharacter, total_level: 6 });

      const response = await request(app)
        .put("/api/characters/1")
        .send({ total_level: 6 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("total_level", 6);
      expect(updateCharacter).toHaveBeenCalledWith("1", { total_level: 6 });
      expect(findCharacterById).toHaveBeenCalledWith("1");
    });

    it("should return 500 if the repository throws an error", async () => {
      updateCharacter.mockRejectedValue(new Error("Database error"));

      const response = await request(app)
        .put("/api/characters/1")
        .send({ total_level: 6 });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Database error");
    });
  });

  describe("DELETE /api/characters/:id (deleteCharacterController)", () => {
    it("should return 204 when a character is deleted successfully", async () => {
      deleteCharacter.mockResolvedValue();

      const response = await request(app).delete("/api/characters/1");

      // 204 No Content shouldn't have a body
      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(deleteCharacter).toHaveBeenCalledWith("1");
    });

    it("should return 500 if the deletion fails at the database level", async () => {
      deleteCharacter.mockRejectedValue(new Error("Delete failed"));

      const response = await request(app).delete("/api/characters/1");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Delete failed");
    });
  });
});
