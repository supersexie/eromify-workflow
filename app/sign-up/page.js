import { authEnabled, googleEnabled } from "@/auth";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }) {
  if (!authEnabled) redirect("/app");

  const params = await searchParams;
  const callbackUrl = typeof params?.callbackUrl === "string" ? params.callbackUrl : "/app";

  return (
    <div className="auth-wrap">
      <AuthForm mode="signup" callbackUrl={callbackUrl} googleEnabled={googleEnabled} />
    </div>
  );
}
