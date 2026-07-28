import { PrismaClient, Role, Department, ExperienceLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROLES = Object.values(Role);
const DEPARTMENTS = Object.values(Department);
const EXPERIENCE_LEVELS = Object.values(ExperienceLevel);
const FIRST_NAMES = [
  "Ava", "Liam", "Noah", "Emma", "Olivia", "Mia", "Ethan", "Sofia", "Lucas", "Zara",
  "Yusuf", "Amara", "Hiro", "Nadia", "Omar", "Priya", "Kenji", "Layla", "Diego", "Chloe",
];
const LAST_NAMES = [
  "Rahman", "Khan", "Silva", "Nakamura", "Garcia", "Novak", "Osei", "Chowdhury", "Iqbal", "Rossi",
  "Petrov", "Haque", "Alam", "Mendes", "Suzuki", "Farooq", "Costa", "Begum", "Islam", "Tanaka",
];
const TEAM_NAMES = ["Atlas", "Nimbus", "Orbit", "Vertex", "Beacon", null];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithinLastYears(years: number): Date {
  const now = Date.now();
  const past = now - years * 365 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const count = 60;

  const users = Array.from({ length: count }, (_, i) => {
    const first = randomFrom(FIRST_NAMES);
    const last = randomFrom(LAST_NAMES);
    return {
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      passwordHash,
      role: randomFrom(ROLES),
      department: randomFrom(DEPARTMENTS),
      experienceLevel: randomFrom(EXPERIENCE_LEVELS),
      teamName: randomFrom(TEAM_NAMES),
      birthdate: "1995-01-01",
      createdAt: randomDateWithinLastYears(2),
    };
  });

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log(`Seeded ${users.length} dummy users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
