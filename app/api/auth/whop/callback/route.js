import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/sign-up", req.url));
  }

  const tokenRes = await fetch("https://api.whop.com/api/v5/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: process.env.WHOP_CLIENT_ID,
      client_secret: process.env.WHOP_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "https://magicmint.pro"}/api/auth/whop/callback`,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/sign-up?error=whop_auth", req.url));
  }

  const { access_token } = await tokenRes.json();

  const userRes = await fetch("https://api.whop.com/api/v5/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/sign-up?error=whop_user", req.url));
  }

  const user = await userRes.json();

  const cookieStore = await cookies();
  cookieStore.set("whop_token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  cookieStore.set("whop_user", JSON.stringify({ id: user.id, email: user.email, name: user.name }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return NextResponse.redirect(new URL("/app", req.url));
}
