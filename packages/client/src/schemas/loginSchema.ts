import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().min(1, "errors.emailRequired").email("errors.emailInvalid"),
  password: z.string().min(8, "errors.passwordMinLogin"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
