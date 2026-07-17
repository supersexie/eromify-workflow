import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserTier } from "@/lib/apiGate";
import { getUsage, getLimit } from "@/lib/creditStore";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  const tier = await getUserTier();

  if (!userId || !tier) {
    return NextResponse.json({ tier: null, used: 0, limit: 0, remaining: 0 });
  }

  const limit = getLimit(tier);
  const { used } = await getUsage(userId);
  const remaining = Math.max(0, limit - used);

  return NextResponse.json({ tier, used, limit, remaining });
}
