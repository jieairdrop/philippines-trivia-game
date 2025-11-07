import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";  // Use server client
import { getLeaderboard } from "@/lib/db-helpers";  // Reuse the dashboard's helper

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Call the existing getLeaderboard from db-helpers (matches dashboard)
    const leaderboard = await getLeaderboard(limit);

    return NextResponse.json({ data: leaderboard });
  } catch (error) {
    console.error("[API] Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
