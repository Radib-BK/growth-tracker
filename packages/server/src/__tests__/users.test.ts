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

// A small, deterministic set of users spanning roles, departments, and
// experience levels, used by the filtering and sorting tests.
const diverseUsers = [
  { email: email("users-test-alice"), role: "LEARNER", department: "Engineering", experienceLevel: "JUNIOR" },
  { email: email("users-test-bob"),   role: "LEARNER", department: "Design",      experienceLevel: "MID" },
  {
    email: email("users-test-carol"),
    role: "MANAGER",
    department: "Product",
    experienceLevel: "SENIOR",
    teamName: "Platform Team",
  },
] as const;

async function seedDiverseUsers() {
  for (const u of diverseUsers) {
    await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, ...u });
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

  it("echoes the default sort and empty filters", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sort).toEqual({ sortBy: "createdAt", sortOrder: "asc" });
    expect(res.body.filters).toEqual({
      role: null,
      department: null,
      experienceLevel: null,
      search: null,
    });
  });

  // ── Filtering ──

  it("filters by role", async () => {
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ role: "MANAGER" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.users.every((u: { role: string }) => u.role === "MANAGER")).toBe(true);
    expect(res.body.filters.role).toBe("MANAGER");
  });

  it("filters by department", async () => {
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ department: "Design" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.users[0].department).toBe("Design");
  });

  it("filters by experienceLevel", async () => {
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ experienceLevel: "SENIOR" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(1);
    expect(res.body.users[0].experienceLevel).toBe("SENIOR");
  });

  it("combines multiple filters", async () => {
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ role: "LEARNER", department: "Engineering" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Both the token-owner (basePayload) and Alice match.
    expect(res.body.pagination.total).toBe(2);
    expect(
      res.body.users.every(
        (u: { role: string; department: string }) => u.role === "LEARNER" && u.department === "Engineering",
      ),
    ).toBe(true);
  });

  it("searches case-insensitively across email and teamName", async () => {
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    // Matches Carol's teamName "Platform Team".
    const byTeam = await request(app)
      .get("/api/users")
      .query({ search: "PLATFORM" })
      .set("Authorization", `Bearer ${token}`);

    expect(byTeam.status).toBe(200);
    expect(byTeam.body.pagination.total).toBe(1);
    expect(byTeam.body.users[0].teamName).toBe("Platform Team");

    // Matches Alice's email.
    const byEmail = await request(app)
      .get("/api/users")
      .query({ search: "ALICE" })
      .set("Authorization", `Bearer ${token}`);

    expect(byEmail.status).toBe(200);
    expect(byEmail.body.pagination.total).toBe(1);
    expect(byEmail.body.users[0].email).toBe(email("users-test-alice"));
  });

  it("returns 400 for an invalid filter enum value", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ role: "ADMIN" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.role).toBeDefined();
  });

  // ── Sorting ──

  it("sorts by email ascending", async () => {
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ sortBy: "email", sortOrder: "asc" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const emails = res.body.users.map((u: { email: string }) => u.email);
    expect(emails).toEqual([...emails].sort());
    expect(res.body.sort).toEqual({ sortBy: "email", sortOrder: "asc" });
  });

  it("sorts by email descending", async () => {
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ sortBy: "email", sortOrder: "desc" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const emails = res.body.users.map((u: { email: string }) => u.email);
    expect(emails).toEqual([...emails].sort().reverse());
  });

  it("returns 400 for a non-whitelisted sortBy field", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ sortBy: "passwordHash" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.sortBy).toBeDefined();
  });

  it("returns 400 for an invalid sortOrder", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ sortOrder: "sideways" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.sortOrder).toBeDefined();
  });
});
