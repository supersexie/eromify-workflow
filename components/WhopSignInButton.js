"use client";
import { signIn } from "next-auth/react";

export default function WhopSignInButton({ callbackUrl = "/app" }) {
  return (
    <button
      type="button"
      className="auth-whop-btn"
      onClick={() => signIn("whop", { callbackUrl })}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-1-4-4-1 9-4-4 9z"/>
      </svg>
      Continue with Whop
    </button>
  );
}
