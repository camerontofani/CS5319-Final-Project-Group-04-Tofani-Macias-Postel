import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postToService } from "../api/client";

// screen a: same layout as monolith; calls auth-service only (different base url)
export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("alex@university.edu");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function looksOffline(err: unknown) {
    if (err instanceof TypeError) return true;
    const msg = err instanceof Error ? err.message : String(err);
    return /failed to fetch|load failed|networkerror/i.test(msg);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await postToService("auth", "/signup", { email, password });
      navigate("/onboarding");
    } catch (err) {
      if (looksOffline(err)) {
        setMessage(
          "Could not reach auth-service (port 8101). Use “Explore demo” below or start the service.",
        );
      } else {
        setMessage(err instanceof Error ? err.message : "request failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-split">
      <div className="login-brand">
        <div className="login-brand-inner">
          <p className="login-brand-title">SmartStudy</p>
          <h1>Study smarter, not harder.</h1>
          <p className="login-brand-sub">
            Your AI-powered study companion for academic success.
          </p>
          <ul className="login-brand-list">
            <li>AI-powered personalized study plans</li>
            <li>Real-time progress tracking and insights</li>
            <li>Collaborative study groups</li>
            <li>Smart schedule adjustments</li>
          </ul>
          <div className="login-stats">
            <div>
              <strong>12K+</strong>
              <span>Students</span>
            </div>
            <div>
              <strong>94%</strong>
              <span>Pass rate</span>
            </div>
            <div>
              <strong>4.9</strong>
              <span>Rating</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-panel">
        <h2>Welcome back</h2>
        <p className="login-caption">Sign in to continue your study journey.</p>

        <div className="login-toggle" role="tablist">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Log In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              required
            />
          </label>
          {mode === "login" && (
            <div className="login-row">
              <span />
              <button type="button" className="link-btn">
                Forgot password?
              </button>
            </div>
          )}
          <button type="submit" className="btn-primary" disabled={busy}>
            {mode === "login" ? "Sign In →" : "Create account →"}
          </button>
        </form>

        {message && <p className="form-hint">{message}</p>}

        <p className="form-hint login-skip">
          <button
            type="button"
            className="link-btn"
            onClick={() => navigate("/onboarding")}
          >
            Explore demo (skip login)
          </button>
          <span className="muted"> — works without microservices running</span>
        </p>

        <div className="login-divider">or continue with</div>
        <div className="login-social">
          <button type="button" className="btn-outline">
            Google
          </button>
          <button type="button" className="btn-outline">
            Microsoft
          </button>
        </div>
        <p className="login-foot">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => setMode("signup")}
          >
            Sign up for free
          </button>
        </p>
      </div>
    </div>
  );
}
