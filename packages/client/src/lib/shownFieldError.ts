import type { FieldPath, FieldValues, FormState, UseFormGetFieldState } from "react-hook-form";
import type { TFunction } from "i18next";

export function shownFieldError<T extends FieldValues>(
  name: FieldPath<T>,
  getFieldState: UseFormGetFieldState<T>,
  formState: FormState<T>,
  t: TFunction,
) {
  const { error, isTouched } = getFieldState(name, formState);
  if (!(isTouched || formState.submitCount > 0) || !error?.message) return undefined;
  return t(error.message);
}
