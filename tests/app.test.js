const request = require("supertest");
const app = require("../app.js");

describe("Check healthcheck endpoints", () => {
  it("Should return status 200 on /health/alive", async () => {
    const response = await request(app).get("/health/alive");

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("OK");
  });
});
