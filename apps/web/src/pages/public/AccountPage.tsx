import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import type { AuthResponse } from "@personal-ecommerce/shared";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useDocumentHead } from "../../hooks/useDocumentHead";
import { api, ApiError, setAccessToken } from "../../lib/apiClient";
import { useLocale } from "../../context/LocaleContext";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium text-surface-muted";

export function AccountPage() {
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const { showToast } = useToast();
  const { t } = useLocale();
  useDocumentHead(t("account.title"), t("account.metaDescription"));

  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { user: updated } = await api.patch<{ user: typeof user }>("/auth/me", { name });
      if (updated) updateUser(updated);
      showToast(t("account.profileUpdated"));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t("account.couldntUpdateProfile"), "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(t("account.passwordsDontMatch"));
      return;
    }

    setChangingPassword(true);
    try {
      const data = await api.post<AuthResponse>("/auth/change-password", { currentPassword, newPassword });
      setAccessToken(data.accessToken);
      updateUser(data.user);
      showToast(t("account.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : t("account.couldntChangePassword"));
    } finally {
      setChangingPassword(false);
    }
  }

  if (!user) {
    return <div className="mx-auto max-w-2xl px-6 py-12 text-sm text-surface-muted">{t("account.loading")}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">{t("account.title")}</h1>

      <div className="mt-8 rounded-xl border border-white/10 bg-navy-soft p-6">
        <h2 className="text-sm font-semibold text-white">{t("account.profile")}</h2>
        <form onSubmit={handleProfileSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className={labelClass} htmlFor="account-name">{t("account.fullName")}</label>
            <input id="account-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="account-email">{t("account.email")}</label>
            <input id="account-email" disabled value={user.email} className={inputClass + " opacity-60"} />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="w-fit bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50"
          >
            {savingProfile ? t("account.saving") : t("account.saveChanges")}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-navy-soft p-6">
        <h2 className="text-sm font-semibold text-white">{t("account.changePassword")}</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className={labelClass} htmlFor="current-password">{t("account.currentPassword")}</label>
            <input
              id="current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="new-password">{t("account.newPassword")}</label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="confirm-password">{t("account.confirmNewPassword")}</label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
          <button
            type="submit"
            disabled={changingPassword}
            className="w-fit bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50"
          >
            {changingPassword ? t("account.changing") : t("account.changePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
