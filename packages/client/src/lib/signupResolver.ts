import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import { validateEmailField } from "@/lib/checkEmailAvailability";
import {
  signupFormSchema,
  type SignupFormInput,
  type SignupFormValues,
} from "@/schemas/signupSchema";

const zodResolve = zodResolver(signupFormSchema);

export const signupResolver: Resolver<SignupFormInput, unknown, SignupFormValues> = async (
  values,
  context,
  options,
) => {
  const result = await zodResolve(values, context, options);
  const errors = result.errors ? { ...result.errors } : {};

  if (!errors.email) {
    const emailResult = await validateEmailField(values.email);
    if (emailResult !== true) {
      errors.email = { type: "custom", message: emailResult };
    }
  }

  if (Object.keys(errors).length > 0) {
    return { values: {}, errors };
  }

  return result;
};
