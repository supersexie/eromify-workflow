import { NextResponse } from "next/server";
import { createUser } from "@/lib/userStore";
import { authEnabled } from "@/auth";

export const runtime = "nodejs";

export async function POST(req) {
  if (!authEnabled) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 503 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body?.email || "").trim();
  const password = String(body?.password || "");
  const name = String(body?.name || "").trim();

  try {
    const user = await createUser({ email, password, name });
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    const message = err?.message || "Could not create account.";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
