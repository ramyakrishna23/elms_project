const request = require("supertest");
const app = require("../app");

describe("Backend Health Check", () => {
  test("GET /health should return 200 OK", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("OK");
  });

  test("GET / should return backend message", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Backend is running");
  });
});
