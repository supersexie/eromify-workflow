import { redirect } from "next/navigation";

// Google OAuth covers sign-up — send everyone to the same sign-in page.
export default function Page() {
  redirect("/sign-in");
}
