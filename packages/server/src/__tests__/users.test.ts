import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../app";

const prisma = new PrismaClient();

// All test accounts use this domain so cleanup is scoped and safe
const TEST_EMAIL_SUFFIX = "@test.growthtracker.local";
const email = (name: string) => `${name}${TEST_EMAIL_SUFFIX}`;

async function cleanupTestUsers() {
  await prisma.user.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_SUFFIX } },
  });
}

beforeAll(async () => {
  await cleanupTestUsers();
});

afterEach(async () => {
  await cleanupTestUsers();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const basePayload = {
  email: email("users-test-learner"),
  password: "Secret123!",
  role: "LEARNER" as const,
  department: "Engineering",
  experienceLevel: "MID" as const,
  birthdate: "1995-06-15",
};

async function signupAndGetToken(payload = basePayload) {
  const res = await request(app).post("/api/auth/signup").send(payload);
  return res.body.accessToken as string;
}

async function createUsers(count: number) {
  for (let i = 0; i < count; i++) {
    await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, email: email(`users-test-page-${i}`) });
  }
}

describe("GET /api/users", () => {
  it("returns 401 with no token", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("returns 401 with a malformed token", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", "Bearer not.a.valid.token");
    expect(res.status).toBe(401);
  });

  it("returns the first page of 10 users by default", async () => {
    const token = await signupAndGetToken();
    await createUsers(11);

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(10);
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 10, total: 12, totalPages: 2 });
    expect(res.body.users[0].passwordHash).toBeUndefined();
  });

  it("returns the second page with remaining users", async () => {
    const token = await signupAndGetToken();
    await createUsers(11);

    const res = await request(app)
      .get("/api/users")
      .query({ page: 2 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.pagination).toEqual({ page: 2, pageSize: 10, total: 12, totalPages: 2 });
  });

  it("returns an empty list for a page beyond the last one", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ page: 5 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(0);
    expect(res.body.pagination).toEqual({ page: 5, pageSize: 10, total: 1, totalPages: 1 });
  });

  it("returns 400 for a non-positive page value", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ page: 0 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.page).toBeDefined();
  });

  it("returns 400 for a non-numeric page value", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ page: "abc" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.page).toBeDefined();
  });
});
