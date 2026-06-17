import { describe, it, expect } from "vitest";
import { validateAllSignupFields } from "@/lib/signupValidation";

describe("validateAllSignupFields teamName", () => {
  const base = {
    email: "test1@gmail.com",
    password: "Secret123!",
    department: "",
    experienceLevel: "JUNIOR" as const,
    bio: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    addresses: [],
  };

  it("returns teamName error when manager leaves team name empty", () => {
    const errs = validateAllSignupFields({
      ...base,
      role: "MANAGER",
      teamName: "",
      department: "Engineering",
      birthYear: "1995",
      birthMonth: "06",
      birthDay: "15",
    });
    expect(errs.teamName).toBe("Team name is required for managers");
  });

  it("returns teamName error even when other fields are invalid", () => {
    const errs = validateAllSignupFields({
      ...base,
      role: "MANAGER",
      teamName: "",
    });
    expect(errs.teamName).toBe("Team name is required for managers");
    expect(errs.department).toBe("Select a department");
  });

  it("does not return teamName error for learners", () => {
    const errs = validateAllSignupFields({
      ...base,
      role: "LEARNER",
      teamName: "",
    });
    expect(errs.teamName).toBeUndefined();
  });
});
