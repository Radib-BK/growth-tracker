import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/useAuth";
import { useLangPath } from "@/hooks/useLangPath";
import { shownFieldError } from "@/lib/shownFieldError";
import { loginFormSchema, type LoginFormValues } from "@/schemas/loginSchema";

function RequiredMark() {
  return (
    <span className="ms-0.5 text-destructive" aria-hidden="true">
      *
    </span>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const { path } = useLangPath();
  const [apiError, setApiError] = useState("");

  const { register, handleSubmit, getFieldState, control } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const formState = useFormState({ control });

  const err = (name: keyof LoginFormValues) =>
    shownFieldError(name, getFieldState, formState, t);

  const onSubmit = handleSubmit(async (data) => {
    setApiError("");

    try {
      await login(data.email, data.password);
      navigate(path(""));
    } catch (error) {
      if (isAxiosError(error)) {
        setApiError(error.response?.data?.message ?? t("login.loginFailedDefault"));
        return;
      }
      setApiError(t("login.loginFailedDefault"));
    }
  });

  return (
    <div className="w-full max-w-lg px-6 py-8">
      <h1 className="mb-6 font-semibold text-2xl text-foreground">{t("login.title")}</h1>

      <form data-testid="login-form" onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">
            {t("login.emailLabel")}
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
            {t("login.passwordLabel")}
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
          {t("login.submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link to={path("/signup")} className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("login.signupLink")}
        </Link>
      </p>
    </div>
  );
}

export default Login;
