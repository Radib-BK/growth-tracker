import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { daysInMonth } from "@/lib/birthdate";
import { PASSWORD_RULES } from "@/lib/passwordRules";
import {
  buildSignupFormValues,
  type SignupFormState,
  validateAllSignupFields,
  validateSignupField,
} from "@/lib/signupValidation";
import { cn } from "@/lib/utils";
import {
  DEPARTMENTS,
  signupFormSchema,
  toSignupPayload,
  validateDepartmentField,
} from "@/schemas/signupSchema";

const API_URL = "http://localhost:8000/api/auth/signup";

const EXPERIENCE_LEVELS = [
  { value: "JUNIOR" as const, label: "Junior", description: "0–2 years of experience" },
  { value: "MID" as const, label: "Mid", description: "3–5 years of experience" },
  { value: "SENIOR" as const, label: "Senior", description: "6+ years of experience" },
];

type AddressFormItem = {
  id: string;
  isOpen: boolean;
  label: string;
  street1: string;
  street2: string;
  city: string;
  zipCode: string;
};

function RequiredMark() {
  return (
    <span className="ml-0.5 text-destructive" aria-hidden="true">
      *
    </span>
  );
}

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"LEARNER" | "MANAGER">("LEARNER");
  const [teamName, setTeamName] = useState("");
  const [department, setDepartment] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"JUNIOR" | "MID" | "SENIOR">("JUNIOR");
  const [bio, setBio] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [addresses, setAddresses] = useState<AddressFormItem[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState("");

  function setDepartmentError(value: string) {
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
  }

  function getFormState(): SignupFormState {
    return {
      email,
      password,
      role,
      teamName,
      department,
      experienceLevel,
      bio,
      birthYear,
      birthMonth,
      birthDay,
      addresses: addresses.map(({ street2, zipCode, label, street1, city }) => ({
        label,
        street1,
        street2,
        city,
        zipCode,
      })),
    };
  }

  function fieldError(field: string) {
    return touched[field] ? fieldErrors[field] : undefined;
  }

  function addressFieldError(index: number, field: string) {
    const key = `addresses.${index}.${field}`;
    return touched[key] ? fieldErrors[key] : undefined;
  }

  function handleAddressBlur(index: number, field: string) {
    const key = `addresses.${index}.${field}`;
    setTouched((prev) => ({ ...prev, [key]: true }));
    const message = validateSignupField(getFormState(), key);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[key] = message;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const message = validateSignupField(getFormState(), field);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function handleRoleChange(newRole: "LEARNER" | "MANAGER") {
    setRole(newRole);
    if (newRole === "LEARNER") {
      setTeamName("");
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.teamName;
        return next;
      });
      setTouched((prev) => {
        const next = { ...prev };
        delete next.teamName;
        return next;
      });
    }
  }

  function handleYearChange(v: string) {
    setBirthYear(v);
    setBirthMonth("");
    setBirthDay("");
  }

  function handleMonthChange(v: string) {
    setBirthMonth(v);
    if (v && birthYear) {
      const max = daysInMonth(Number(birthYear), Number(v));
      if (birthDay && Number(birthDay) > max) {
        setBirthDay("");
      }
    }
  }

  function addAddress() {
    setAddresses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        isOpen: true,
        label: "",
        street1: "",
        street2: "",
        city: "",
        zipCode: "",
      },
    ]);
  }

  function removeAddress(id: string) {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAddress(id: string, field: keyof AddressFormItem, value: string | boolean) {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  }

  function toggleAddress(id: string) {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isOpen: !a.isOpen } : a)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    const errs = validateAllSignupFields(getFormState());
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.keys(errs).map((key) => [key, true])),
      }));
      return;
    }
    
    const formData = signupFormSchema.parse(buildSignupFormValues(getFormState()));
    
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(toSignupPayload(formData)),
    });

    const responseData = await res.json();
    if (!res.ok) {
      const details = responseData.errors
        ? Object.values(responseData.errors as Record<string, string[]>).flat().join(" ")
        : "";
      setApiError([responseData.message, details].filter(Boolean).join(": ") || "Signup failed");
      return;
    }

    localStorage.setItem("accessToken", responseData.accessToken);
    navigate("/");
  }

  return (
    <div className="w-full max-w-lg px-6 py-8">
      <h1 className="mb-6 font-semibold text-2xl text-foreground">Create Account</h1>

      <form data-testid="signup-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">
            Email
            <RequiredMark />
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            data-testid="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
            aria-invalid={!!fieldError("email")}
          />
          {fieldError("email") && (
            <p className="text-sm text-destructive">{fieldError("email")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password
            <RequiredMark />
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur("password")}
            aria-invalid={!!fieldError("password")}
          />
          {fieldError("password") && (
            <p className="text-sm text-destructive">{fieldError("password")}</p>
          )}
          <ul className="mt-2 space-y-1">
            {PASSWORD_RULES.map(({ id, test, label }) => {
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
            Role
            <RequiredMark />
          </Label>
          <RadioGroup
            value={role}
            onValueChange={(v) => handleRoleChange(v as "LEARNER" | "MANAGER")}
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
                  role === "LEARNER"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground",
                )}
              >
                Learner
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
                  role === "MANAGER"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground",
                )}
              >
                Manager
              </Label>
            </div>
          </RadioGroup>
        </div>

        {role === "MANAGER" && (
          <div className="space-y-2">
            <Label htmlFor="teamName">Team name<RequiredMark /></Label>
            <Input
              id="teamName"
              type="text"
              data-testid="team-name-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onBlur={() => handleBlur("teamName")}
              aria-invalid={!!fieldError("teamName")}
            />
            {fieldError("teamName") && (
              <p className="text-sm text-destructive">{fieldError("teamName")}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="department">
            Department
            <RequiredMark />
          </Label>
          <Select
            value={department || undefined}
            onValueChange={(v) => {
              setDepartment(v);
              setTouched((prev) => ({ ...prev, department: true }));
              setDepartmentError(v);
            }}
            onOpenChange={(open) => {
              if (!open) {
                setTouched((prev) => ({ ...prev, department: true }));
                if (!department) {
                  setDepartmentError("");
                }
              }
            }}
          >
            <SelectTrigger
              id="department"
              className="w-full"
              data-testid="department-select"
              aria-invalid={!!fieldError("department")}
            >
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem
                  key={dept}
                  value={dept}
                >
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError("department") && (
            <p className="text-sm text-destructive">{fieldError("department")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Experience level
            <RequiredMark />
          </Label>
          <RadioGroup
            value={experienceLevel}
            onValueChange={(v) => setExperienceLevel(v as "JUNIOR" | "MID" | "SENIOR")}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">
            Bio <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="bio"
            data-testid="bio-input"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            onBlur={() => handleBlur("bio")}
            maxLength={250}
            rows={3}
            aria-invalid={!!fieldError("bio")}
          />
          {fieldError("bio") && (
            <p className="text-sm text-destructive">{fieldError("bio")}</p>
          )}
          <p data-testid="bio-char-count" className="text-xs text-muted-foreground">
            {bio.length} / 250
          </p>
        </div>

        <div className="space-y-2">
          <Label>
            Birthdate
            <RequiredMark />
          </Label>
          <BirthdateSelects
            year={birthYear}
            month={birthMonth}
            day={birthDay}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
            onDayChange={setBirthDay}
            onYearBlur={() => handleBlur("birthYear")}
            onMonthBlur={() => handleBlur("birthMonth")}
            onDayBlur={() => handleBlur("birthDay")}
            yearInvalid={!!fieldError("birthYear")}
            monthInvalid={!!fieldError("birthMonth")}
            dayInvalid={!!fieldError("birthDay")}
          />
          {(fieldError("birthYear") ||
            fieldError("birthMonth") ||
            fieldError("birthDay")) && (
            <p className="text-sm text-destructive">
              {fieldError("birthYear") ??
                fieldError("birthMonth") ??
                fieldError("birthDay")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>
              Addresses <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Button
              type="button"
              variant="link"
              data-testid="add-address-btn"
              onClick={addAddress}
              className="h-auto p-0"
            >
              Add an address
            </Button>
          </div>

          {addresses.map((addr, index) => (
            <div
              key={addr.id}
              data-testid="address-group"
              className="rounded-md border border-input"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleAddress(addr.id)}
                className="flex h-auto w-full items-center justify-between rounded-none px-3 py-2 font-medium"
              >
                {addr.label || "New address"}
                <span>{addr.isOpen ? "−" : "+"}</span>
              </Button>
              <div className={cn("space-y-3 px-3 pb-3", !addr.isOpen && "hidden")}>
                <div className="space-y-2">
                  <Label htmlFor={`address-label-${addr.id}`}>
                    Label
                    <RequiredMark />
                  </Label>
                  <Input
                    id={`address-label-${addr.id}`}
                    type="text"
                    placeholder="e.g. Home"
                    data-testid="address-label-input"
                    value={addr.label}
                    onChange={(e) => updateAddress(addr.id, "label", e.target.value)}
                    onBlur={() => handleAddressBlur(index, "label")}
                    aria-invalid={!!addressFieldError(index, "label")}
                  />
                  {addressFieldError(index, "label") && (
                    <p className="text-sm text-destructive">{addressFieldError(index, "label")}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`address-street1-${addr.id}`}>
                    Street address
                    <RequiredMark />
                  </Label>
                  <Input
                    id={`address-street1-${addr.id}`}
                    type="text"
                    placeholder="123 Main St"
                    data-testid="address-street1-input"
                    value={addr.street1}
                    onChange={(e) => updateAddress(addr.id, "street1", e.target.value)}
                    onBlur={() => handleAddressBlur(index, "street1")}
                    aria-invalid={!!addressFieldError(index, "street1")}
                  />
                  {addressFieldError(index, "street1") && (
                    <p className="text-sm text-destructive">{addressFieldError(index, "street1")}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`address-street2-${addr.id}`}>
                    Apt, suite, etc.{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id={`address-street2-${addr.id}`}
                    type="text"
                    placeholder="Apt 4B"
                    data-testid="address-street2-input"
                    value={addr.street2}
                    onChange={(e) => updateAddress(addr.id, "street2", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`address-city-${addr.id}`}>
                    City
                    <RequiredMark />
                  </Label>
                  <Input
                    id={`address-city-${addr.id}`}
                    type="text"
                    placeholder="New York"
                    data-testid="address-city-input"
                    value={addr.city}
                    onChange={(e) => updateAddress(addr.id, "city", e.target.value)}
                    onBlur={() => handleAddressBlur(index, "city")}
                    aria-invalid={!!addressFieldError(index, "city")}
                  />
                  {addressFieldError(index, "city") && (
                    <p className="text-sm text-destructive">{addressFieldError(index, "city")}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`address-zip-${addr.id}`}>
                    ZIP code
                    <RequiredMark />
                  </Label>
                  <Input
                    id={`address-zip-${addr.id}`}
                    type="number"
                    placeholder="10001"
                    data-testid="address-zip-input"
                    value={addr.zipCode}
                    onChange={(e) => updateAddress(addr.id, "zipCode", e.target.value)}
                    onBlur={() => handleAddressBlur(index, "zipCode")}
                    aria-invalid={!!addressFieldError(index, "zipCode")}
                  />
                  {addressFieldError(index, "zipCode") && (
                    <p className="text-sm text-destructive">{addressFieldError(index, "zipCode")}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="link"
                  data-testid="remove-address-btn"
                  onClick={() => removeAddress(addr.id)}
                  className="h-auto p-0 text-destructive"
                >
                  Remove address
                </Button>
              </div>
            </div>
          ))}
        </div>

        {apiError && (
          <p data-testid="error-message" className="text-sm text-destructive">
            {apiError}
          </p>
        )}

        <Button type="submit" data-testid="submit-btn" className="w-full">
          Sign Up
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default Signup;
