import { z } from "zod";
import { isValidBirthdate, toBirthdateString } from "@/lib/birthdate";

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Operations",
  "HR",
  "Other",
] as const;

const departmentFieldSchema = z.enum(DEPARTMENTS, { message: "Select a department" });

const addressSchema = z.object({
  label: z.string().min(1).max(100),
  street1: z.string().min(1).max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  zipCode: z.number().int().positive(),
});

export const signupFormSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "At least one capital letter")
      .regex(/[^A-Za-z0-9]/, "At least one special character"),
    role: z.enum(["LEARNER", "MANAGER"]),
    department: z.enum(DEPARTMENTS, { message: "Select a department" }),
    experienceLevel: z.enum(["JUNIOR", "MID", "SENIOR"]),
    teamName: z.string().optional(),
    bio: z.string().max(250).optional(),
    birthYear: z.string().min(1, "Select a year"),
    birthMonth: z.string().min(1, "Select a month"),
    birthDay: z.string().min(1, "Select a day"),
    addresses: z.array(addressSchema).default([]),
  })
  .refine((d) => d.role !== "MANAGER" || !!d.teamName?.trim(), {
    message: "Team name is required for managers",
    path: ["teamName"],
  })
  .refine((d) => isValidBirthdate(d.birthYear, d.birthMonth, d.birthDay), {
    message: "Invalid birthdate",
    path: ["birthDay"],
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;

export function validateDepartmentField(value: string): string | undefined {
  if (!value) return "Select a department";
  const result = departmentFieldSchema.safeParse(value);
  if (!result.success) return result.error.issues[0]?.message;
  return undefined;
}

export function toSignupPayload(data: SignupFormValues) {
  const birthdate = toBirthdateString(data.birthYear, data.birthMonth, data.birthDay);
  return {
    email: data.email,
    password: data.password,
    role: data.role,
    department: data.department,
    experienceLevel: data.experienceLevel,
    birthdate,
    ...(data.role === "MANAGER" && data.teamName ? { teamName: data.teamName.trim() } : {}),
    ...(data.bio?.trim() ? { bio: data.bio.trim() } : {}),
    addresses: data.addresses,
  };
}
