import { NextResponse } from "next/server";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";
import { assertAdminSession } from "@/lib/server/admin-auth";
import { repoGetStats } from "@/lib/server/admin-repository";

export async function GET() {
  if (isSupabaseAuthConfigured()) {
    const denied = await assertAdminSession();
    if (denied) return denied;
  }

  try {
    const stats = await repoGetStats();
    return NextResponse.json(stats);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed to load stats" }, { status: 500 });
  }
}
