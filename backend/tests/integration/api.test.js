import request from "supertest";
import express from "express";
import { createNewUser, getUser } from "../../controllers/user.controller.js";
import sequelize from "../../config/sequelize.js";

const app = express();
app.use(express.json());

app.post("/api/users", createNewUser);
app.get("/api/users/:id", getUser);

describe("User Integration - Get Player", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    await sequelize.truncate({ force: true });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("should successfully create and then retrieve a player", async () => {
    const newUser = {
      user_name: "Marisha Ray",
      email: "marisha@criticalrole.com",
      password: "keyleth_is_dope",
    };

    const createRes = await request(app).post("/api/users").send(newUser);

    expect(createRes.status).toBe(201);
    const playerId = createRes.body.id;

    const getRes = await request(app).get(`/api/users/${playerId}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.user_name).toBe("Marisha Ray");
    expect(getRes.body.email).toBe("marisha@criticalrole.com");

    expect(getRes.body).not.toHaveProperty("password");
  });

  it("should return 404 for a non-existent player", async () => {
    const getRes = await request(app).get("/api/users/9999");
    expect(getRes.status).toBe(404);
  });
});
