import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";

async function getWhopToken() {
  const session = await auth();
  if (session?.user?.whopToken) return session.user.whopToken;

  const cookieStore = await cookies();
  return cookieStore.get("whop_token")?.value || null;
}

export async function GET() {
  const token = await getWhopToken();

  if (!token) {
    return NextResponse.json({ tier: null, active: false });
  }

  const res = await fetch("https://api.whop.com/api/v5/me/memberships", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ tier: null, active: false });
  }

  const data = await res.json();
  const active = data.data?.find(
    (m) => m.status === "active" || m.status === "trialing"
  );

  if (!active) {
    return NextResponse.json({ tier: null, active: false });
  }

  const productName = (active.product?.name || "").toLowerCase();
  let tier = "builder";
  for (const key of ["creator", "growth", "launch", "builder"]) {
    if (productName.includes(key)) {
      tier = key;
      break;
    }
  }

  return NextResponse.json({
    tier,
    active: true,
    productName: active.product?.name,
    expiresAt: active.renewal_period_end,
  });
}
