import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccess } from "./planGate";

const TIER_ORDER = ["creator", "growth", "launch", "builder"];

async function getWhopToken() {
  const session = await auth();
  if (session?.user?.whopToken) return session.user.whopToken;

  const cookieStore = await cookies();
  return cookieStore.get("whop_token")?.value || null;
}

export async function getUserTier() {
  const token = await getWhopToken();
  if (!token) return null;

  const res = await fetch("https://api.whop.com/api/v5/me/memberships", {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const active = data.data?.find(
    (m) => m.status === "active" || m.status === "trialing"
  );
  if (!active) return null;

  const name = (active.product?.name || "").toLowerCase();
  for (const t of TIER_ORDER) {
    if (name.includes(t)) return t;
  }
  return "builder";
}

export async function requireFeature(feature) {
  const tier = await getUserTier();
  if (!tier) {
    return NextResponse.json(
      { error: "No active subscription. Please subscribe at whop.com/magic-mint/" },
      { status: 403 }
    );
  }
  if (!canAccess(feature, tier)) {
    return NextResponse.json(
      { error: `Your ${tier} plan does not include ${feature}. Please upgrade.` },
      { status: 403 }
    );
  }
  return null;
}
