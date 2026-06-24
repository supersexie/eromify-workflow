import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Page() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect("/app");
  return (
    <div className="auth-wrap">
      <SignUp signInUrl="/sign-in" forceRedirectUrl="/app" />
    </div>
  );
}
