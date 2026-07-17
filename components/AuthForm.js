"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import WhopSignInButton from "@/components/WhopSignInButton";

export default function AuthForm({ mode = "signin", callbackUrl = "/app", googleEnabled = true, whopEnabled = false }) {
  const isSignUp = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Could not create account.");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(isSignUp ? "Account created, but sign-in failed. Try signing in." : "Invalid email or password.");
        setLoading(false);
        return;
      }

      window.location.href = result?.url || callbackUrl;
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand">m</div>
      <h1 className="auth-title">{isSignUp ? "Create your account" : "Welcome back"}</h1>
      <p className="auth-sub">
        {isSignUp ? "Sign up with email or Google to start creating." : "Sign in with email or Google."}
      </p>

      <form className="auth-form" onSubmit={onSubmit}>
        {isSignUp && (
          <label className="auth-field">
            <span>Name</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </label>
        )}
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? "At least 8 characters" : "Your password"}
          />
        </label>

        {error ? <p className="auth-error">{error}</p> : null}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? (isSignUp ? "Creating…" : "Signing in…") : isSignUp ? "Create account" : "Sign in"}
        </button>
      </form>

      {(googleEnabled || whopEnabled) && (
        <>
          <div className="auth-divider"><span>or</span></div>
          {whopEnabled && <WhopSignInButton callbackUrl={callbackUrl} />}
          {googleEnabled && <GoogleSignInButton callbackUrl={callbackUrl} />}
        </>
      )}

      <p className="auth-switch">
        {isSignUp ? (
          <>Already have an account? <Link href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Sign in</Link></>
        ) : (
          <>New here? <Link href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Create an account</Link></>
        )}
      </p>
    </div>
  );
}
