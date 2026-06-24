"use client";
import { UserButton } from "@clerk/nextjs";

const CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Clerk avatar + sign-out menu. Renders nothing until Clerk keys are set
// (so the app works with auth disabled).
export default function UserMenu() {
  if (!CLERK_ENABLED) return null;
  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{ elements: { userButtonAvatarBox: { width: 32, height: 32 } } }}
    />
  );
}
