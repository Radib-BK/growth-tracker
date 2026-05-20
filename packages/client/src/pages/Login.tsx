import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginFormSchema,
  validateAllLoginFields,
  validateLoginField,
} from "@/schemas/loginSchema";

const API_URL = "http://localhost:8000/api/auth/login";

function RequiredMark() {
  return (
    <span className="ml-0.5 text-destructive" aria-hidden="true">
      *
    </span>
  );
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState("");

  function getFormValues() {
    return { email, password };
  }

  function fieldError(field: string) {
    return touched[field] ? fieldErrors[field] : undefined;
  }

  function handleBlur(field: "email" | "password") {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const message = validateLoginField(getFormValues(), field);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    const values = getFormValues();
    const errs = validateAllLoginFields(values);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.keys(errs).map((key) => [key, true])),
      }));
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(loginFormSchema.parse(values)),
    });

    const responseData = await res.json();
    if (!res.ok) {
      setApiError(responseData.message ?? "Login failed");
      return;
    }

    localStorage.setItem("accessToken", responseData.accessToken);
    navigate("/");
  }

  return (
    <div className="w-full max-w-lg px-6 py-8">
      <h1 className="mb-6 font-semibold text-2xl text-foreground">Log in</h1>

      <form data-testid="login-form" onSubmit={handleSubmit} className="space-y-5">
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
            autoComplete="current-password"
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
        </div>

        {apiError && (
          <p data-testid="error-message" className="text-sm text-destructive">
            {apiError}
          </p>
        )}

        <Button type="submit" data-testid="submit-btn" className="w-full">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default Login;
