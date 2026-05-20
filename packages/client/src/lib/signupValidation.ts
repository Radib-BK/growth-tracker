import { signupFormSchema, validateDepartmentField } from "@/schemas/signupSchema";

export { validateDepartmentField };

function issuePathKey(path: PropertyKey[]): string {
  return path.map(String).join(".") || "form";
}

export type SignupFormState = {
  email: string;
  password: string;
  role: "LEARNER" | "MANAGER";
  teamName: string;
  department: string;
  experienceLevel: "JUNIOR" | "MID" | "SENIOR";
  bio: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  addresses: {
    label: string;
    street1: string;
    street2: string;
    city: string;
    zipCode: string;
  }[];
};

export function buildSignupFormValues(state: SignupFormState) {
  return {
    email: state.email,
    password: state.password,
    role: state.role,
    department: state.department || undefined,
    experienceLevel: state.experienceLevel,
    teamName: state.role === "MANAGER" ? state.teamName : undefined,
    bio: state.bio || undefined,
    birthYear: state.birthYear,
    birthMonth: state.birthMonth,
    birthDay: state.birthDay,
    addresses: state.addresses.map(({ label, street1, street2, city, zipCode }) => ({
      label,
      street1,
      street2,
      city,
      zipCode,
    })),
  };
}

export function validateSignupField(
  state: SignupFormState,
  field: string,
): string | undefined {
  const result = signupFormSchema.safeParse(buildSignupFormValues(state));
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issuePathKey(issue.path) === field)?.message;
}

export function validateAllSignupFields(state: SignupFormState): Record<string, string> {
  const result = signupFormSchema.safeParse(buildSignupFormValues(state));
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issuePathKey(issue.path);
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
