"use client";
import { useSession, signOut } from "next-auth/react";

// Google-auth avatar + sign-out. Hidden when there's no session (auth off or signed out).
export default function UserMenu() {
  const { data: session, status } = useSession();
  if (status !== "authenticated" || !session?.user) return null;

  const name = session.user.name || session.user.email || "Account";
  const image = session.user.image;

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-menu-btn"
        title={name}
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" width={32} height={32} className="user-menu-avatar" />
        ) : (
          <span className="user-menu-fallback">{name.slice(0, 1).toUpperCase()}</span>
        )}
      </button>
    </div>
  );
}
