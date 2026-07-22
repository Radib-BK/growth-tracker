import { useState } from "react";
import { isAxiosError } from "axios";
import { signupResolver } from "@/lib/signupResolver";
import { shownFieldError } from "@/lib/shownFieldError";
import { signup as signupRequest } from "@/lib/authApi";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  Controller,
  useFieldArray,
  useForm,
  useFormState,
  useWatch,
  type FieldPath,
} from "react-hook-form";
import { BirthdateSelects } from "@/components/signup/BirthdateSelects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLangPath } from "@/hooks/useLangPath";
import { daysInMonth } from "@/lib/birthdate";
import { getPasswordRules } from "@/lib/passwordRules";
import { cn } from "@/lib/utils";
import {
  DEPARTMENTS,
  type SignupFormInput,
  type SignupFormValues,
  toSignupPayload,
} from "@/schemas/signupSchema";

const defaultValues: SignupFormInput = {
  email: "",
  password: "",
  role: "LEARNER",
  teamName: "",
  department: "",
  experienceLevel: "JUNIOR",
  bio: "",
  birthYear: "",
  birthMonth: "",
  birthDay: "",
  addresses: [],
};

function RequiredMark() {
  return (
    <span className="ms-0.5 text-destructive" aria-hidden="true">
      *
    </span>
  );
}

function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { path } = useLangPath();
  const [apiError, setApiError] = useState("");
  const [closedAddresses, setClosedAddresses] = useState<Set<string>>(() => new Set());

  const EXPERIENCE_LEVELS = [
    { value: "JUNIOR" as const, label: t("signup.experienceJunior"), description: t("signup.experienceJuniorDesc") },
    { value: "MID" as const, label: t("signup.experienceMid"), description: t("signup.experienceMidDesc") },
    { value: "SENIOR" as const, label: t("signup.experienceSenior"), description: t("signup.experienceSeniorDesc") },
  ];

  const form = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: signupResolver,
    mode: "onBlur",
    defaultValues,
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    trigger,
    getFieldState,
  } = form;

  const formState = useFormState({ control });

  const { fields, append, remove } = useFieldArray({ control, name: "addresses" });

  const [role, password, bio, birthYear, birthMonth, birthDay] = useWatch({
    control,
    name: ["role", "password", "bio", "birthYear", "birthMonth", "birthDay"],
  });

  const err = (name: FieldPath<SignupFormInput>) =>
    shownFieldError(name, getFieldState, formState, t);

  function handleYearChange(v: string) {
    setValue("birthYear", v);
    setValue("birthMonth", "");
    setValue("birthDay", "");
    void trigger(["birthYear", "birthMonth", "birthDay"]);
  }

  function handleMonthChange(v: string) {
    setValue("birthMonth", v);
    if (v && birthYear) {
      const max = daysInMonth(Number(birthYear), Number(v));
      if (birthDay && Number(birthDay) > max) {
        setValue("birthDay", "");
        void trigger("birthDay");
      }
    }
    void trigger("birthMonth");
  }

  function toggleAddress(id: string) {
    setClosedAddresses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const onSubmit = handleSubmit(async (data) => {
    setApiError("");

    try {
      await signupRequest(toSignupPayload(data));
      navigate(path("/login"));
    } catch (error) {
      if (isAxiosError(error)) {
        const responseData = error.response?.data as
          | { message?: string; errors?: Record<string, string[]> }
          | undefined;
        const details = responseData?.errors
          ? Object.values(responseData.errors).flat().join(" ")
          : "";
        setApiError(
          [responseData?.message, details].filter(Boolean).join(": ") || t("signup.signupFailedDefault"),
        );
        return;
      }
      setApiError(t("signup.signupFailedDefault"));
    }
  });

  return (
    <div className="w-full max-w-lg px-6 py-8">
      <h1 className="mb-6 font-semibold text-2xl text-foreground">{t("signup.title")}</h1>

      <form
        data-testid="signup-form"
        onSubmit={onSubmit}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label htmlFor="email">
            {t("signup.emailLabel")}
            <RequiredMark />
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            data-testid="email-input"
            aria-invalid={!!err("email")}
            {...register("email")}
          />
          {err("email") && <p className="text-sm text-destructive">{err("email")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            {t("signup.passwordLabel")}
            <RequiredMark />
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="password-input"
            aria-invalid={!!err("password")}
            {...register("password")}
          />
          {err("password") && <p className="text-sm text-destructive">{err("password")}</p>}
          <ul className="mt-2 space-y-1">
            {getPasswordRules(t).map(({ id, test, label }) => {
              const met = test(password);
              return (
                <li
                  key={id}
                  data-testid={`password-rule-${id}`}
                  data-met={met ? "true" : "false"}
                  className={cn("text-sm", met ? "text-green-600" : "text-muted-foreground")}
                >
                  {label}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <Label>
            {t("signup.roleLabel")}
            <RequiredMark />
          </Label>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  if (v === "LEARNER") setValue("teamName", "");
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <RadioGroupItem
                    value="LEARNER"
                    id="role-learner"
                    data-testid="role-learner"
                    className="absolute size-0 opacity-0"
                  />
                  <Label
                    htmlFor="role-learner"
                    className={cn(
                      "flex h-9 w-full cursor-pointer items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors",
                      field.value === "LEARNER"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-foreground",
                    )}
                  >
                    {t("signup.roleLearner")}
                  </Label>
                </div>
                <div className="relative flex-1">
                  <RadioGroupItem
                    value="MANAGER"
                    id="role-manager"
                    data-testid="role-manager"
                    className="absolute size-0 opacity-0"
                  />
                  <Label
                    htmlFor="role-manager"
                    className={cn(
                      "flex h-9 w-full cursor-pointer items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors",
                      field.value === "MANAGER"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background text-foreground",
                    )}
                  >
                    {t("signup.roleManager")}
                  </Label>
                </div>
              </RadioGroup>
            )}
          />
        </div>

        {role === "MANAGER" && (
          <div className="space-y-2">
            <Label htmlFor="teamName">
              {t("signup.teamNameLabel")}
              <RequiredMark />
            </Label>
            <Input
              id="teamName"
              type="text"
              data-testid="team-name-input"
              aria-invalid={!!err("teamName")}
              {...register("teamName")}
            />
            {err("teamName") && <p className="text-sm text-destructive">{err("teamName")}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="department">
            {t("signup.departmentLabel")}
            <RequiredMark />
          </Label>
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                onOpenChange={(open) => {
                  if (!open) void trigger("department");
                }}
              >
                <SelectTrigger
                  id="department"
                  className="w-full"
                  data-testid="department-select"
                  aria-invalid={!!err("department")}
                >
                  <SelectValue placeholder={t("signup.selectDepartmentPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {err("department") && <p className="text-sm text-destructive">{err("department")}</p>}
        </div>

        <div className="space-y-2">
          <Label>
            {t("signup.experienceLabel")}
            <RequiredMark />
          </Label>
          <Controller
            name="experienceLevel"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="space-y-2"
              >
                {EXPERIENCE_LEVELS.map(({ value, label, description }) => (
                  <Label
                    key={value}
                    htmlFor={`experience-${value.toLowerCase()}`}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-input p-3 has-data-[state=checked]:border-primary"
                  >
                    <RadioGroupItem
                      value={value}
                      id={`experience-${value.toLowerCase()}`}
                      data-testid={`experience-${value.toLowerCase()}`}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground">{description}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">
            {t("signup.bioLabel")} <span className="font-normal text-muted-foreground">{t("signup.optional")}</span>
          </Label>
          <Textarea
            id="bio"
            data-testid="bio-input"
            maxLength={250}
            rows={3}
            aria-invalid={!!err("bio")}
            {...register("bio")}
          />
          {err("bio") && <p className="text-sm text-destructive">{err("bio")}</p>}
          <p data-testid="bio-char-count" className="text-xs text-muted-foreground">
            {(bio ?? "").length} / 250
          </p>
        </div>

        <div className="space-y-2">
          <Label>
            {t("signup.birthdateLabel")}
            <RequiredMark />
          </Label>
          <BirthdateSelects
            year={birthYear}
            month={birthMonth}
            day={birthDay}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
            onDayChange={(v) => {
              setValue("birthDay", v);
              void trigger("birthDay");
            }}
            onYearBlur={() => void trigger("birthYear")}
            onMonthBlur={() => void trigger("birthMonth")}
            onDayBlur={() => void trigger("birthDay")}
            yearInvalid={!!err("birthYear")}
            monthInvalid={!!err("birthMonth")}
            dayInvalid={!!err("birthDay")}
          />
          {(err("birthYear") || err("birthMonth") || err("birthDay")) && (
            <p className="text-sm text-destructive">
              {err("birthYear") ?? err("birthMonth") ?? err("birthDay")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              {t("signup.addressesLabel")} <span className="font-normal text-muted-foreground">{t("signup.optional")}</span>
            </Label>
            <Button
              type="button"
              variant="link"
              data-testid="add-address-btn"
              onClick={() =>
                append({ label: "", street1: "", street2: "", city: "", zipCode: "" })
              }
              className="h-auto p-0"
            >
              {t("signup.addAddress")}
            </Button>
          </div>

          {fields.map((field, index) => {
            const isOpen = !closedAddresses.has(field.id);

            return (
              <div
                key={field.id}
                data-testid="address-group"
                className="rounded-md border border-input"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleAddress(field.id)}
                  className="flex h-auto w-full items-center justify-between rounded-none px-3 py-2 font-medium"
                >
                  {field.label || t("signup.newAddress")}
                  <span>{isOpen ? "−" : "+"}</span>
                </Button>
                <div className={cn("space-y-3 px-3 pb-3", !isOpen && "hidden")}>
                  <div className="space-y-2">
                    <Label htmlFor={`address-label-${field.id}`}>
                      {t("signup.addressLabelField")}
                      <RequiredMark />
                    </Label>
                    <Input
                      id={`address-label-${field.id}`}
                      type="text"
                      placeholder={t("signup.addressLabelPlaceholder")}
                      data-testid="address-label-input"
                      aria-invalid={!!err(`addresses.${index}.label`)}
                      {...register(`addresses.${index}.label`)}
                    />
                    {err(`addresses.${index}.label`) && (
                      <p className="text-sm text-destructive">{err(`addresses.${index}.label`)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`address-street1-${field.id}`}>
                      {t("signup.street1Label")}
                      <RequiredMark />
                    </Label>
                    <Input
                      id={`address-street1-${field.id}`}
                      type="text"
                      placeholder={t("signup.street1Placeholder")}
                      data-testid="address-street1-input"
                      aria-invalid={!!err(`addresses.${index}.street1`)}
                      {...register(`addresses.${index}.street1`)}
                    />
                    {err(`addresses.${index}.street1`) && (
                      <p className="text-sm text-destructive">
                        {err(`addresses.${index}.street1`)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`address-street2-${field.id}`}>
                      {t("signup.street2Label")}{" "}
                      <span className="font-normal text-muted-foreground">{t("signup.optional")}</span>
                    </Label>
                    <Input
                      id={`address-street2-${field.id}`}
                      type="text"
                      placeholder={t("signup.street2Placeholder")}
                      data-testid="address-street2-input"
                      {...register(`addresses.${index}.street2`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`address-city-${field.id}`}>
                      {t("signup.cityLabel")}
                      <RequiredMark />
                    </Label>
                    <Input
                      id={`address-city-${field.id}`}
                      type="text"
                      placeholder={t("signup.cityPlaceholder")}
                      data-testid="address-city-input"
                      aria-invalid={!!err(`addresses.${index}.city`)}
                      {...register(`addresses.${index}.city`)}
                    />
                    {err(`addresses.${index}.city`) && (
                      <p className="text-sm text-destructive">{err(`addresses.${index}.city`)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`address-zip-${field.id}`}>
                      {t("signup.zipLabel")}
                      <RequiredMark />
                    </Label>
                    <Input
                      id={`address-zip-${field.id}`}
                      type="number"
                      placeholder={t("signup.zipPlaceholder")}
                      data-testid="address-zip-input"
                      aria-invalid={!!err(`addresses.${index}.zipCode`)}
                      {...register(`addresses.${index}.zipCode`)}
                    />
                    {err(`addresses.${index}.zipCode`) && (
                      <p className="text-sm text-destructive">
                        {err(`addresses.${index}.zipCode`)}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    data-testid="remove-address-btn"
                    onClick={() => remove(index)}
                    className="h-auto p-0 text-destructive"
                  >
                    {t("signup.removeAddress")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {apiError && (
          <p data-testid="error-message" className="text-sm text-destructive">
            {apiError}
          </p>
        )}

        <Button type="submit" data-testid="submit-btn" className="w-full">
          {t("signup.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("signup.haveAccount")}{" "}
        <Link to={path("/login")} className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("signup.loginLink")}
        </Link>
      </p>
    </div>
  );
}

export default Signup;
