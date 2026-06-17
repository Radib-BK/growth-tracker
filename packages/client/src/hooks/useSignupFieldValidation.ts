import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkEmailAvailability,
  EMAIL_UNAVAILABLE_MESSAGE,
} from "@/lib/checkEmailAvailability";
import {
  type SignupFormState,
  validateAllSignupFields,
  validateSignupField,
} from "@/lib/signupValidation";
import { validateDepartmentField, validateEmailFormat } from "@/schemas/signupSchema";

const DEBOUNCE_MS = 300;

export function useSignupFieldValidation(getFormState: () => SignupFormState) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formStateRef = useRef(getFormState());
  const touchedRef = useRef(touched);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const emailCheckAbortRef = useRef<AbortController | null>(null);
  const emailCheckGenerationRef = useRef(0);

  formStateRef.current = getFormState();
  touchedRef.current = touched;

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      emailCheckAbortRef.current?.abort();
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const applyFieldValidation = useCallback((field: string) => {
    const message = validateSignupField(formStateRef.current, field);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  }, []);

  const applyEmailValidation = useCallback(async () => {
    const email = formStateRef.current.email;
    const syncError = validateEmailFormat(email);

    if (syncError) {
      emailCheckGenerationRef.current += 1;
      emailCheckAbortRef.current?.abort();
      setFieldErrors((prev) => {
        const next = { ...prev };
        next.email = syncError;
        return next;
      });
      return;
    }

    emailCheckAbortRef.current?.abort();
    const controller = new AbortController();
    emailCheckAbortRef.current = controller;
    const generation = ++emailCheckGenerationRef.current;

    const available = await checkEmailAvailability(email, controller.signal);
    if (generation !== emailCheckGenerationRef.current) return;

    setFieldErrors((prev) => {
      const next = { ...prev };
      if (available === false) {
        next.email = EMAIL_UNAVAILABLE_MESSAGE;
      } else {
        delete next.email;
      }
      return next;
    });
  }, []);

  const clearScheduledValidation = useCallback((field: string) => {
    const timer = timersRef.current.get(field);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(field);
    }
  }, []);

  const scheduleFieldValidation = useCallback(
    (field: string) => {
      if (!touchedRef.current[field]) return;

      clearScheduledValidation(field);
      timersRef.current.set(
        field,
        setTimeout(() => {
          timersRef.current.delete(field);
          if (field === "email") {
            void applyEmailValidation();
          } else {
            applyFieldValidation(field);
          }
        }, DEBOUNCE_MS),
      );
    },
    [applyEmailValidation, applyFieldValidation, clearScheduledValidation],
  );

  const markTouched = useCallback((field: string) => {
    touchedRef.current = { ...touchedRef.current, [field]: true };
    setTouched(touchedRef.current);
  }, []);

  const handleBlur = useCallback(
    (field: string) => {
      clearScheduledValidation(field);
      markTouched(field);
      if (field === "email") {
        void applyEmailValidation();
      } else {
        applyFieldValidation(field);
      }
    },
    [applyEmailValidation, applyFieldValidation, clearScheduledValidation, markTouched],
  );

  const handleAddressBlur = useCallback(
    (index: number, field: string) => {
      handleBlur(`addresses.${index}.${field}`);
    },
    [handleBlur],
  );

  const setDepartmentError = useCallback(
    (value: string) => {
      markTouched("department");
      const message = validateDepartmentField(value);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (message) {
          next.department = message;
        } else {
          delete next.department;
        }
        return next;
      });
    },
    [markTouched],
  );

  const fieldError = useCallback(
    (field: string) => (touched[field] ? fieldErrors[field] : undefined),
    [fieldErrors, touched],
  );

  const addressFieldError = useCallback(
    (index: number, field: string) => fieldError(`addresses.${index}.${field}`),
    [fieldError],
  );

  const validateAllAndTouch = useCallback(async () => {
    const errs = validateAllSignupFields(formStateRef.current);
    const email = formStateRef.current.email;

    if (!errs.email && email) {
      emailCheckAbortRef.current?.abort();
      const controller = new AbortController();
      emailCheckAbortRef.current = controller;
      const available = await checkEmailAvailability(email, controller.signal);
      if (available === false) {
        errs.email = EMAIL_UNAVAILABLE_MESSAGE;
      }
    }

    setFieldErrors(errs);
    const allTouched = Object.fromEntries(Object.keys(errs).map((key) => [key, true]));
    touchedRef.current = { ...touchedRef.current, ...allTouched };
    setTouched(touchedRef.current);
    return errs;
  }, []);

  const clearField = useCallback(
    (field: string) => {
      clearScheduledValidation(field);
      if (field === "email") {
        emailCheckGenerationRef.current += 1;
        emailCheckAbortRef.current?.abort();
      }
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      const nextTouched = { ...touchedRef.current };
      delete nextTouched[field];
      touchedRef.current = nextTouched;
      setTouched(nextTouched);
    },
    [clearScheduledValidation],
  );

  return {
    fieldError,
    addressFieldError,
    handleBlur,
    handleAddressBlur,
    scheduleFieldValidation,
    setDepartmentError,
    validateAllAndTouch,
    clearField,
  };
}
