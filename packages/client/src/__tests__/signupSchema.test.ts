import { describe, it, expect } from "vitest";
import {
  SELECT_DEPARTMENT_MESSAGE,
  signupFormSchema,
  TEAM_NAME_REQUIRED_MESSAGE,
} from "@/schemas/signupSchema";

const base = {
  email: "test1@gmail.com",
  password: "Secret123!",
  department: "Engineering",
  experienceLevel: "JUNIOR",
  bio: "",
  birthYear: "1995",
  birthMonth: "06",
  birthDay: "15",
  addresses: [],
};

describe("signupFormSchema teamName", () => {
  it("requires team name for managers", () => {
    const result = signupFormSchema.safeParse({
      ...base,
      role: "MANAGER",
      teamName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const teamNameIssue = result.error.issues.find((i) => i.path[0] === "teamName");
      expect(teamNameIssue?.message).toBe(TEAM_NAME_REQUIRED_MESSAGE);
    }
  });

  it("requires team name even when other fields are invalid", () => {
    const result = signupFormSchema.safeParse({
      ...base,
      role: "MANAGER",
      teamName: "",
      department: "",
      birthYear: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain(TEAM_NAME_REQUIRED_MESSAGE);
      expect(messages).toContain(SELECT_DEPARTMENT_MESSAGE);
    }
  });

  it("does not require team name for learners", () => {
    const result = signupFormSchema.safeParse({
      ...base,
      role: "LEARNER",
      teamName: "",
    });
    expect(result.success).toBe(true);
  });
});
