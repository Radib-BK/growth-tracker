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

const addressFormInputSchema = z.object({
  label: z.string(),
  street1: z.string(),
  street2: z.string(),
  city: z.string(),
  zipCode: z.string(),
});

export type AddressFormInput = z.infer<typeof addressFormInputSchema>;

export function isBlankAddress(a: AddressFormInput) {
  return (
    !a.label.trim() &&
    !a.street1.trim() &&
    !a.street2.trim() &&
    !a.city.trim() &&
    !a.zipCode.trim()
  );
}

const validatedAddressFields = z.object({
  label: z.string().min(1, "Label is required").max(100),
  street1: z.string().min(1, "Street address is required").max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  zipCode: z
    .number({ invalid_type_error: "Enter a valid ZIP code" })
    .int()
    .positive("Enter a valid ZIP code"),
});

function validateAddressEntry(
  addr: AddressFormInput,
  index: number,
  ctx: z.RefinementCtx,
) {
  if (isBlankAddress(addr)) return;

  const result = validatedAddressFields.safeParse({
    label: addr.label.trim(),
    street1: addr.street1.trim(),
    city: addr.city.trim(),
    ...(addr.street2.trim() ? { street2: addr.street2.trim() } : {}),
    zipCode: Number(addr.zipCode),
  });

  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({
        code: "custom",
        message: issue.message,
        path: ["addresses", index, ...issue.path],
      });
    }
  }
}

export function normalizeAddresses(addrs: AddressFormInput[]) {
  return addrs
    .filter((a) => !isBlankAddress(a))
    .map(({ street2, zipCode, label, street1, city }) => ({
      label: label.trim(),
      street1: street1.trim(),
      city: city.trim(),
      ...(street2.trim() ? { street2: street2.trim() } : {}),
      zipCode: Number(zipCode),
    }));
}

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
    addresses: z.array(addressFormInputSchema).default([]),
  })
  .refine((d) => d.role !== "MANAGER" || !!d.teamName?.trim(), {
    message: "Team name is required for managers",
    path: ["teamName"],
  })
  .refine((d) => isValidBirthdate(d.birthYear, d.birthMonth, d.birthDay), {
    message: "Invalid birthdate",
    path: ["birthDay"],
  })
  .superRefine((data, ctx) => {
    data.addresses.forEach((addr, index) => validateAddressEntry(addr, index, ctx));
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
    addresses: normalizeAddresses(data.addresses),
  };
}
