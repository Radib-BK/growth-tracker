import type { FieldPath, FieldValues, FormState, UseFormGetFieldState } from "react-hook-form";

export function shownFieldError<T extends FieldValues>(
  name: FieldPath<T>,
  getFieldState: UseFormGetFieldState<T>,
  formState: FormState<T>,
) {
  const { error, isTouched } = getFieldState(name, formState);
  return (isTouched || formState.submitCount > 0) ? error?.message : undefined;
}
