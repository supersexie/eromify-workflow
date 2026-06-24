import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Page() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect("/app");
  return (
    <div className="auth-wrap">
      <SignIn signUpUrl="/sign-up" forceRedirectUrl="/app" />
    </div>
  );
}
