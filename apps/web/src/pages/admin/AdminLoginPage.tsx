import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Role } from "@personal-ecommerce/shared";
import { ApiError } from "../../lib/apiClient";
import { useAuth } from "../../context/AuthContext";

export function AdminLoginPage() {
  const { login, logout } = useAuth();
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
      const user = await login({ email, password });
      if (user.role !== Role.ADMIN) {
        await logout();
        setError("This sign-in is for store administrators only.");
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center text-2xl font-extrabold tracking-tight">VOLT Admin</div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            placeholder="Password"
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
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
