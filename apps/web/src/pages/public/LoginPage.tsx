import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../lib/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useLocale } from "../../context/LocaleContext";

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-6 py-24">
      <h1 className="text-2xl font-bold">{t("auth.signIn")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent"
        />
        <input
          type="password"
          required
          placeholder={t("auth.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-accent px-4 py-3 font-semibold hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? t("auth.signingIn") : t("auth.signIn")}
        </button>
      </form>
      <p className="text-sm text-surface-muted">
        {t("auth.noAccount")}{" "}
        <Link to="/register" className="text-accent hover:underline">
          {t("auth.createOne")}
        </Link>
      </p>
    </div>
  );
}
