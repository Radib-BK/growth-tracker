import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shownFieldError } from "@/lib/shownFieldError";
import { loginFormSchema, type LoginFormValues } from "@/schemas/loginSchema";

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
  const [apiError, setApiError] = useState("");

  const { register, handleSubmit, getFieldState, control } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const formState = useFormState({ control });

  const err = (name: keyof LoginFormValues) =>
    shownFieldError(name, getFieldState, formState);

  const onSubmit = handleSubmit(async (data) => {
    setApiError("");

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const responseData = await res.json();
    if (!res.ok) {
      setApiError(responseData.message ?? "Login failed");
      return;
    }

    localStorage.setItem("accessToken", responseData.accessToken);
    navigate("/");
  });

  return (
    <div className="w-full max-w-lg px-6 py-8">
      <h1 className="mb-6 font-semibold text-2xl text-foreground">Log in</h1>

      <form data-testid="login-form" onSubmit={onSubmit} className="space-y-5">
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
            aria-invalid={!!err("email")}
            {...register("email")}
          />
          {err("email") && <p className="text-sm text-destructive">{err("email")}</p>}
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
            aria-invalid={!!err("password")}
            {...register("password")}
          />
          {err("password") && <p className="text-sm text-destructive">{err("password")}</p>}
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
