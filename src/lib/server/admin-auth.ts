import { NextResponse } from "next/server";
import { isSupabaseAuthConfigured } from "@/lib/env/supabase";
import { getSupabaseUser } from "@/lib/supabase/server-user";

/** When Supabase Auth is configured, require a logged-in user for admin mutations / sensitive reads. */
export async function assertAdminSession(): Promise<NextResponse | null> {
  if (!isSupabaseAuthConfigured()) return null;
  const user = await getSupabaseUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
