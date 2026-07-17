import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("whop_token")?.value;

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
