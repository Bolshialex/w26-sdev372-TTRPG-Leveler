import request from "supertest";
import express from "express";

// 1. Import all REAL controllers (NO MOCKS!)
import {
  getUsersController,
  getUser,
  createNewUser,
  updateExistingUser,
  deleteExistingUser,
} from "../../controllers/user.controller.js";

import {
  createCharacterController,
  getCharacterByCharacterId,
  getAllCharactersByUserId,
  updateCharacterController,
  deleteCharacterController,
} from "../../controllers/characters.controller.js";

// 2. Import your database connection / ORM instance
// NOTE: Adjust this path to wherever your Sequelize/DB connection is initialized
import { sequelize } from "../../config/database.js";

// 3. Set up the Express app with the real routes
const app = express();
app.use(express.json());

// User Routes
app.get("/api/users", getUsersController);
app.get("/api/users/:id", getUser);
app.post("/api/users", createNewUser);
app.put("/api/users/:id", updateExistingUser);
app.delete("/api/users/:id", deleteExistingUser);

// Character Routes
app.post("/api/characters", createCharacterController);
app.get("/api/characters/:charId", getCharacterByCharacterId);
app.get("/api/users/:userId/characters", getAllCharactersByUserId);
app.put("/api/characters/:id", updateCharacterController);
app.delete("/api/characters/:id", deleteCharacterController);

describe("API Integration Tests (Real Database)", () => {
  // ==========================================
  // DATABASE SETUP & TEARDOWN
  // ==========================================

  beforeAll(async () => {
    // DANGER: Ensure your test environment connects to a TEST database!
    // { force: true } drops existing tables and recreates them.
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    // Truncate clears all data inside the tables between tests
    // cascade: true ensures foreign key constraints don't block truncation
    await sequelize.truncate({ cascade: true });
  });

  afterAll(async () => {
    // Close the connection so Jest can exit cleanly
    await sequelize.close();
  });

  // ==========================================
  // USER INTEGRATION TESTS
  // ==========================================

  describe("User CRUD Lifecycle", () => {
    it("should completely manage a user lifecycle in the database", async () => {
      // --- 1. CREATE ---
      const newUserPayload = {
        user_name: "Matthew Mercer",
        user_email: "matt@criticalrole.com",
        user_password: "howdoyouwanttodothis",
      };

      const createRes = await request(app)
        .post("/api/users")
        .send(newUserPayload);

      expect(createRes.status).toBe(201);
      expect(createRes.body).toHaveProperty("id");
      expect(createRes.body.user_name).toBe("Matthew Mercer");
      expect(createRes.body).not.toHaveProperty("user_password"); // Ensure sanitization works

      const userId = createRes.body.id;

      // --- 2. READ (ALL & SINGLE) ---
      const readAllRes = await request(app).get("/api/users");
      expect(readAllRes.status).toBe(200);
      expect(readAllRes.body.length).toBeGreaterThan(0);

      const readSingleRes = await request(app).get(`/api/users/${userId}`);
      expect(readSingleRes.status).toBe(200);
      expect(readSingleRes.body.user_name).toBe("Matthew Mercer");

      // --- 3. UPDATE ---
      const updateRes = await request(app)
        .put(`/api/users/${userId}`)
        .send({ user_name: "DM Matt" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.user_name).toBe("DM Matt");

      // --- 4. DELETE ---
      const deleteRes = await request(app).delete(`/api/users/${userId}`);
      expect(deleteRes.status).toBe(200);

      // Verify deletion
      const finalReadRes = await request(app).get(`/api/users/${userId}`);
      expect(finalReadRes.status).toBe(404);
    });
  });

  // ==========================================
  // CHARACTER INTEGRATION TESTS
  // ==========================================

  describe("Character CRUD Lifecycle", () => {
    it("should completely manage a character lifecycle tied to a user", async () => {
      // PRE-REQUISITE: Create a user so we have a valid user_id for the character
      const userRes = await request(app).post("/api/users").send({
        user_name: "Travis Willingham",
        user_email: "travis@criticalrole.com",
        user_password: "i_would_like_to_rage",
      });
      const validUserId = userRes.body.id;

      // --- 1. CREATE CHARACTER ---
      const newCharData = {
        user_id: validUserId,
        char_name: "Grog Strongjaw",
        total_level: 10,
        strength: 20,
      };

      const createCharRes = await request(app)
        .post("/api/characters")
        .send(newCharData);

      expect(createCharRes.status).toBe(201);
      expect(createCharRes.body.char_name).toBe("Grog Strongjaw");

      const characterId = createCharRes.body.id;

      // --- 2. READ CHARACTER (BY CHAR ID & USER ID) ---
      const readByCharIdRes = await request(app).get(
        `/api/characters/${characterId}`,
      );
      expect(readByCharIdRes.status).toBe(200);
      expect(readByCharIdRes.body.strength).toBe(20);

      const readByUserIdRes = await request(app).get(
        `/api/users/${validUserId}/characters`,
      );
      expect(readByUserIdRes.status).toBe(200);
      // Verify it returns an array containing our character
      expect(Array.isArray(readByUserIdRes.body)).toBe(true);
      expect(readByUserIdRes.body[0].char_name).toBe("Grog Strongjaw");

      // --- 3. UPDATE CHARACTER ---
      const updateCharRes = await request(app)
        .put(`/api/characters/${characterId}`)
        .send({ total_level: 11 });

      expect(updateCharRes.status).toBe(200);
      expect(updateCharRes.body.total_level).toBe(11);

      // --- 4. DELETE CHARACTER ---
      const deleteCharRes = await request(app).delete(
        `/api/characters/${characterId}`,
      );
      expect(deleteCharRes.status).toBe(204);

      // Verify deletion
      const finalReadRes = await request(app).get(
        `/api/characters/${characterId}`,
      );
      expect(finalReadRes.status).toBe(404);
    });
  });
});
