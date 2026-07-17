import { authEnabled } from "@/auth";
import { redirect } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  if (!authEnabled) redirect("/app");

  const params = await searchParams;
  const callbackUrl = typeof params?.callbackUrl === "string" ? params.callbackUrl : "/app";

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">m</div>
        <h1 className="auth-title">Welcome to Magic Mint</h1>
        <p className="auth-sub">Sign in with Google to start creating.</p>
        <GoogleSignInButton callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
