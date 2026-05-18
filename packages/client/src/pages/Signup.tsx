import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BirthdateSelects } from "@/components/signup/BirthdateSelects";
import { daysInMonth } from "@/lib/birthdate";
import { PASSWORD_RULES } from "@/lib/passwordRules";
import { signupFormSchema, toSignupPayload } from "@/schemas/signupSchema";

const API_URL = "http://localhost:8000/api/auth/signup";

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Operations",
  "HR",
  "Other",
] as const;

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
  const [apiError, setApiError] = useState("");

  function handleRoleChange(newRole: "LEARNER" | "MANAGER") {
    setRole(newRole);
    if (newRole === "LEARNER") {
      setTeamName("");
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
    setFieldErrors({});

    const result = signupFormSchema.safeParse({
      email,
      password,
      role,
      department: department || undefined,
      experienceLevel,
      teamName: role === "MANAGER" ? teamName : undefined,
      bio: bio || undefined,
      birthYear,
      birthMonth,
      birthDay,
      addresses: addresses.map(({ id: _id, isOpen: _isOpen, street2, zipCode, ...rest }) => ({
        ...rest,
        ...(street2.trim() ? { street2: street2.trim() } : {}),
        zipCode: Number(zipCode),
      })),
    });

    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form");
        errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(toSignupPayload(result.data)),
    });

    const data = await res.json();
    if (!res.ok) {
      setApiError(data.message ?? "Signup failed");
      return;
    }

    localStorage.setItem("accessToken", data.accessToken);
    navigate("/");
  }

  return (
    <div className="w-full max-w-lg px-6 py-8">
      <h1 className="mb-6 font-semibold text-2xl text-neutral-900">Create account</h1>

      <form data-testid="signup-form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            data-testid="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <ul className="mt-2 space-y-1">
            {PASSWORD_RULES.map(({ id, test, label }) => {
              const met = test(password);
              return (
                <li
                  key={id}
                  data-testid={`password-rule-${id}`}
                  data-met={met ? "true" : "false"}
                  className={met ? "text-green-600 text-sm" : "text-neutral-500 text-sm"}
                >
                  {label}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-neutral-700">Role</span>
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="LEARNER"
                data-testid="role-learner"
                checked={role === "LEARNER"}
                onChange={() => handleRoleChange("LEARNER")}
                className="sr-only"
              />
              <span
                className={`block rounded-md border px-4 py-2 text-center text-sm ${
                  role === "LEARNER"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-700"
                }`}
              >
                Learner
              </span>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="MANAGER"
                data-testid="role-manager"
                checked={role === "MANAGER"}
                onChange={() => handleRoleChange("MANAGER")}
                className="sr-only"
              />
              <span
                className={`block rounded-md border px-4 py-2 text-center text-sm ${
                  role === "MANAGER"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300 bg-white text-neutral-700"
                }`}
              >
                Manager
              </span>
            </label>
          </div>
        </div>

        {role === "MANAGER" && (
          <div>
            <label htmlFor="teamName" className="mb-1 block text-sm font-medium text-neutral-700">
              Team name
            </label>
            <input
              id="teamName"
              type="text"
              data-testid="team-name-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {fieldErrors.teamName && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.teamName}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="department" className="mb-1 block text-sm font-medium text-neutral-700">
            Department
          </label>
          <select
            id="department"
            data-testid="department-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select department
            </option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          {fieldErrors.department && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.department}</p>
          )}
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-neutral-700">Experience level</span>
          <div className="space-y-2">
            {EXPERIENCE_LEVELS.map(({ value, label, description }) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-neutral-200 p-3"
              >
                <input
                  type="radio"
                  name="experienceLevel"
                  value={value}
                  data-testid={`experience-${value.toLowerCase()}`}
                  checked={experienceLevel === value}
                  onChange={() => setExperienceLevel(value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-neutral-900">{label}</span>
                  <span className="block text-xs text-neutral-500">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium text-neutral-700">
            Bio <span className="text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="bio"
            data-testid="bio-input"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={250}
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <p data-testid="bio-char-count" className="mt-1 text-xs text-neutral-500">
            {bio.length} / 250
          </p>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-neutral-700">Birthdate</span>
          <BirthdateSelects
            year={birthYear}
            month={birthMonth}
            day={birthDay}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
            onDayChange={setBirthDay}
          />
          {fieldErrors.birthDay && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.birthDay}</p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">
              Addresses <span className="text-neutral-400">(optional)</span>
            </span>
            <button
              type="button"
              data-testid="add-address-btn"
              onClick={addAddress}
              className="text-sm text-neutral-700 underline"
            >
              Add an address
            </button>
          </div>

          {addresses.map((addr) => (
            <div
              key={addr.id}
              data-testid="address-group"
              className="mb-3 rounded-md border border-neutral-200"
            >
              <button
                type="button"
                onClick={() => toggleAddress(addr.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-neutral-700"
              >
                {addr.label || "New address"}
                <span>{addr.isOpen ? "−" : "+"}</span>
              </button>
              <div className={addr.isOpen ? "block" : "hidden"}>
                <div className="space-y-3 px-3 pb-3">
                  <input
                    type="text"
                    placeholder="Label (e.g. Home)"
                    data-testid="address-label-input"
                    value={addr.label}
                    onChange={(e) => updateAddress(addr.id, "label", e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Street address"
                    data-testid="address-street1-input"
                    value={addr.street1}
                    onChange={(e) => updateAddress(addr.id, "street1", e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    data-testid="address-city-input"
                    value={addr.city}
                    onChange={(e) => updateAddress(addr.id, "city", e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="ZIP code"
                    data-testid="address-zip-input"
                    value={addr.zipCode}
                    onChange={(e) => updateAddress(addr.id, "zipCode", e.target.value)}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    data-testid="remove-address-btn"
                    onClick={() => removeAddress(addr.id)}
                    className="text-sm text-red-600"
                  >
                    Remove address
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {apiError && (
          <p data-testid="error-message" className="text-sm text-red-600">
            {apiError}
          </p>
        )}

        <button
          type="submit"
          data-testid="submit-btn"
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Create account
        </button>
      </form>
    </div>
  );
}

export default Signup;
