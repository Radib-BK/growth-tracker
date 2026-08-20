import { isAxiosError } from "axios";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/useAuth";
import { useLangPath } from "@/hooks/useLangPath";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";

type AddressEntry = {
  key: string;
  label: string;
  street1: string;
  street2: string;
  city: string;
  zipCode: string;
};

function isBlankAddress(a: AddressEntry) {
  return !a.label.trim() && !a.street1.trim() && !a.street2.trim() && !a.city.trim() && !a.zipCode.trim();
}

function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { mutate, isPending, error } = useUpdateProfile();
  const navigate = useNavigate();
  const { path } = useLangPath();

  const [teamName, setTeamName] = useState(user?.teamName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [addresses, setAddresses] = useState<AddressEntry[]>(() =>
    (user?.addresses ?? []).map((a) => ({
      key: a.id,
      label: a.label,
      street1: a.street1,
      street2: a.street2 ?? "",
      city: a.city,
      zipCode: String(a.zipCode),
    })),
  );

  if (!user) return null;

  function addAddress() {
    setAddresses((prev) => [
      ...prev,
      { key: crypto.randomUUID(), label: "", street1: "", street2: "", city: "", zipCode: "" },
    ]);
  }

  function removeAddress(key: string) {
    setAddresses((prev) => prev.filter((a) => a.key !== key));
  }

  function updateAddress(key: string, patch: Partial<AddressEntry>) {
    setAddresses((prev) => prev.map((a) => (a.key === key ? { ...a, ...patch } : a)));
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const addressesPayload = addresses
      .filter((a) => !isBlankAddress(a))
      .map((a) => ({
        label: a.label.trim(),
        street1: a.street1.trim(),
        ...(a.street2.trim() ? { street2: a.street2.trim() } : {}),
        city: a.city.trim(),
        zipCode: Number(a.zipCode),
      }));

    mutate(
      { teamName, bio, addresses: addressesPayload },
      { onSuccess: () => navigate(path("")) },
    );
  };

  const apiErrorMessage = (() => {
    if (!error || !isAxiosError(error)) return undefined;
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    const details = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    return [data?.message, details].filter(Boolean).join(": ") || undefined;
  })();

  return (
    <div className="w-full max-w-2xl space-y-6 px-6 py-8">
      <Navbar />

      <div className="space-y-6 rounded-md border border-input p-6">
        <div className="space-y-2">
          <h2 className="font-semibold text-lg text-foreground">{t("profile.title")}</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">{t("profile.email")}</dt>
            <dd data-testid="profile-email">{user.email}</dd>
            <dt className="text-muted-foreground">{t("profile.role")}</dt>
            <dd>{user.role}</dd>
            <dt className="text-muted-foreground">{t("profile.department")}</dt>
            <dd>{user.department}</dd>
            <dt className="text-muted-foreground">{t("profile.experience")}</dt>
            <dd>{user.experienceLevel}</dd>
            <dt className="text-muted-foreground">{t("profile.birthdate")}</dt>
            <dd>{user.birthdate}</dd>
          </dl>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" data-testid="profile-form">
          <div className="space-y-2">
            <Label htmlFor="teamName">{t("profile.teamNameLabel")}</Label>
            <Input
              id="teamName"
              data-testid="teamName-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">{t("profile.bioLabel")}</Label>
            <Textarea
              id="bio"
              data-testid="bio-input"
              maxLength={250}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t("signup.addressesLabel")}</Label>
              <Button
                type="button"
                variant="link"
                data-testid="add-address-btn"
                onClick={addAddress}
                className="h-auto p-0"
              >
                {t("signup.addAddress")}
              </Button>
            </div>

            {addresses.map((address) => (
              <div
                key={address.key}
                data-testid="address-group"
                className="space-y-3 rounded-md border border-input p-3"
              >
                <div className="space-y-2">
                  <Label htmlFor={`address-label-${address.key}`}>{t("signup.addressLabelField")}</Label>
                  <Input
                    id={`address-label-${address.key}`}
                    data-testid="address-label-input"
                    placeholder={t("signup.addressLabelPlaceholder")}
                    value={address.label}
                    onChange={(e) => updateAddress(address.key, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`address-street1-${address.key}`}>{t("signup.street1Label")}</Label>
                  <Input
                    id={`address-street1-${address.key}`}
                    data-testid="address-street1-input"
                    placeholder={t("signup.street1Placeholder")}
                    value={address.street1}
                    onChange={(e) => updateAddress(address.key, { street1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`address-street2-${address.key}`}>
                    {t("signup.street2Label")}{" "}
                    <span className="font-normal text-muted-foreground">{t("signup.optional")}</span>
                  </Label>
                  <Input
                    id={`address-street2-${address.key}`}
                    data-testid="address-street2-input"
                    placeholder={t("signup.street2Placeholder")}
                    value={address.street2}
                    onChange={(e) => updateAddress(address.key, { street2: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`address-city-${address.key}`}>{t("signup.cityLabel")}</Label>
                  <Input
                    id={`address-city-${address.key}`}
                    data-testid="address-city-input"
                    placeholder={t("signup.cityPlaceholder")}
                    value={address.city}
                    onChange={(e) => updateAddress(address.key, { city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`address-zip-${address.key}`}>{t("signup.zipLabel")}</Label>
                  <Input
                    id={`address-zip-${address.key}`}
                    type="number"
                    data-testid="address-zip-input"
                    placeholder={t("signup.zipPlaceholder")}
                    value={address.zipCode}
                    onChange={(e) => updateAddress(address.key, { zipCode: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="link"
                  data-testid="remove-address-btn"
                  onClick={() => removeAddress(address.key)}
                  className="h-auto p-0 text-destructive"
                >
                  {t("signup.removeAddress")}
                </Button>
              </div>
            ))}
          </div>

          {error && (
            <p data-testid="profile-error" className="text-sm text-destructive">
              {apiErrorMessage ?? t("profile.updateFailed")}
            </p>
          )}

          <Button type="submit" data-testid="save-btn" disabled={isPending}>
            {isPending ? t("profile.saving") : t("profile.save")}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
