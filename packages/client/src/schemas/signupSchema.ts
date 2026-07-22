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

export const EMAIL_INVALID_MESSAGE = "errors.emailInvalid";

export const emailFormatSchema = z.string().min(1, "errors.emailRequired").email(EMAIL_INVALID_MESSAGE);

export const TEAM_NAME_REQUIRED_MESSAGE = "errors.teamNameRequired";

export const SELECT_DEPARTMENT_MESSAGE = "errors.selectDepartment";

const addressFormInputSchema = z.object({
  label: z.string(),
  street1: z.string(),
  street2: z.string(),
  city: z.string(),
  zipCode: z.string(),
});

type AddressFormInput = z.infer<typeof addressFormInputSchema>;

function isBlankAddress(a: AddressFormInput) {
  return (
    !a.label.trim() &&
    !a.street1.trim() &&
    !a.street2.trim() &&
    !a.city.trim() &&
    !a.zipCode.trim()
  );
}

const validatedAddressFields = z.object({
  label: z.string().min(1, "errors.addressLabelRequired").max(100),
  street1: z.string().min(1, "errors.streetRequired").max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1, "errors.cityRequired").max(100),
  zipCode: z
    .number({ invalid_type_error: "errors.zipInvalid" })
    .int()
    .positive("errors.zipInvalid"),
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
    email: emailFormatSchema,
    password: z
      .string()
      .min(8, "errors.passwordLength")
      .regex(/[A-Z]/, "errors.passwordUpper")
      .regex(/[^A-Za-z0-9]/, "errors.passwordSpecial"),
    role: z.enum(["LEARNER", "MANAGER"]),
    department: z
      .string()
      .refine((v): v is (typeof DEPARTMENTS)[number] => DEPARTMENTS.includes(v as (typeof DEPARTMENTS)[number]), {
        message: SELECT_DEPARTMENT_MESSAGE,
      }),
    experienceLevel: z.enum(["JUNIOR", "MID", "SENIOR"]),
    teamName: z.string().optional(),
    bio: z.string().max(250).optional(),
    birthYear: z.string().min(1, "errors.selectYear"),
    birthMonth: z.string().min(1, "errors.selectMonth"),
    birthDay: z.string().min(1, "errors.selectDay"),
    addresses: z.array(addressFormInputSchema),
  })
  .refine((d) => isValidBirthdate(d.birthYear, d.birthMonth, d.birthDay), {
    message: "errors.invalidBirthdate",
    path: ["birthDay"],
  })
  .refine((d) => d.role !== "MANAGER" || !!d.teamName?.trim(), {
    message: TEAM_NAME_REQUIRED_MESSAGE,
    path: ["teamName"],
  })
  .superRefine((data, ctx) => {
    data.addresses.forEach((addr, index) => validateAddressEntry(addr, index, ctx));
  });

export type SignupFormInput = z.input<typeof signupFormSchema>;
export type SignupFormValues = z.infer<typeof signupFormSchema>;

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
