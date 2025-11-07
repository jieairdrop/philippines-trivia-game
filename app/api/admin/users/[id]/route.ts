// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ------------------------------------------------------------------
// SAFETY: check env vars
// ------------------------------------------------------------------
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

// ------------------------------------------------------------------
// Verify admin
// ------------------------------------------------------------------
async function verifyAdmin(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);

  const supabaseAuth = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser(token);

  if (authErr || !user) return null;

  const { data: profile } = await supabaseAuth
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user.id : null;
}

// ------------------------------------------------------------------
// Compute fallback totals (if view row missing)
// ------------------------------------------------------------------
async function computePointsFallback(userId: string, referralBonus = 0) {
  try {
    const { data: attempts } = await supabase!
      .from("game_attempts")
      .select("points_earned")
      .eq("user_id", userId);

    const { data: withdrawals } = await supabase!
      .from("withdrawals")
      .select("points_deducted")
      .eq("user_id", userId)
      .in("status", ["pending", "approved", "completed"]);

    const earned =
      attempts?.reduce((s, a) => s + (Number(a.points_earned) || 0), 0) || 0;
    const used =
      withdrawals?.reduce((s, w) => s + (Number(w.points_deducted) || 0), 0) ||
      0;

    const available = earned + (referralBonus ?? 0) - used;

    return {
      total_points_earned: earned,
      total_points_used: used,
      available_points: available,
    };
  } catch (e) {
    console.error("[FALLBACK] Error computing:", e);
    return {
      total_points_earned: 0,
      total_points_used: 0,
      available_points: 0,
    };
  }
}

// ------------------------------------------------------------------
// GET Handler
// ------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  if (!SUPABASE_URL || !SERVICE_KEY || !supabase) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("Authorization");
  const adminId = await verifyAdmin(authHeader);
  if (!adminId) {
    return NextResponse.json(
      { error: "Unauthorized: Admin access required" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const userId = id?.trim();

  if (!userId) {
    // --------------------------------------------------------------
    // Return list of users
    // --------------------------------------------------------------
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select(
        "id, email, first_name, last_name, created_at, referral_bonus_points"
      )
      .eq("role", "player")
      .order("created_at", { ascending: false });

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    const users = await Promise.all(
      (profiles ?? []).map(async (p) => {
        const { data: stats, error: statsErr } = await supabase
          .from("user_withdrawal_stats")
          .select("available_points, total_amount_withdrawn")
          .eq("user_id", p.id)
          .maybeSingle();

        if (statsErr) console.warn("Stats fetch warning:", statsErr.message);

        let available_points = stats?.available_points;
        if (available_points == null) {
          const fallback = await computePointsFallback(
            p.id,
            p.referral_bonus_points ?? 0
          );
          available_points = fallback.available_points;
        }

        return {
          id: p.id,
          name:
            `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() ||
            p.email.split("@")[0],
          email: p.email,
          created_at: p.created_at,
          total_points: Number(available_points ?? 0),
          total_withdrawn: Number(stats?.total_amount_withdrawn ?? 0),
        };
      })
    );

    return NextResponse.json({ users });
  }

  // --------------------------------------------------------------
  // Validate userId
  // --------------------------------------------------------------
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  // --------------------------------------------------------------
  // Profile
  // --------------------------------------------------------------
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select(
      "id, email, first_name, last_name, referral_bonus_points, created_at, role"
    )
    .eq("id", userId)
    .single();

  if (profileErr || !profile)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const displayName =
    profile.first_name || profile.last_name
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : profile.email.split("@")[0];

  // --------------------------------------------------------------
  // Stats (from user_withdrawal_stats)
  // --------------------------------------------------------------
  const { data: stats } = await supabase
    .from("user_withdrawal_stats")
    .select(
      "available_points, total_points_earned, total_points_used, total_amount_withdrawn, total_withdrawals_completed"
    )
    .eq("user_id", userId)
    .maybeSingle();

  let total_points = 0;
  let total_points_earned = 0;
  let total_points_used = 0;
  let total_withdrawn = 0;
  let total_withdrawals_completed = 0;

  if (stats && stats.available_points != null) {
    total_points = Number(stats.available_points);
    total_points_earned = Number(stats.total_points_earned ?? 0);
    total_points_used = Number(stats.total_points_used ?? 0);
    total_withdrawn = Number(stats.total_amount_withdrawn ?? 0);
    total_withdrawals_completed = Number(stats.total_withdrawals_completed ?? 0);
  } else {
    const fallback = await computePointsFallback(
      userId,
      profile.referral_bonus_points ?? 0
    );
    total_points = fallback.available_points;
    total_points_earned = fallback.total_points_earned;
    total_points_used = fallback.total_points_used;
  }

  // --------------------------------------------------------------
  // Game stats
  // --------------------------------------------------------------
  const { count: totalAttempts } = await supabase
    .from("game_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { count: correctAttempts } = await supabase
    .from("game_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_correct", true);

  const games_played = totalAttempts ?? 0;
  const wins = correctAttempts ?? 0;
  const losses = games_played - wins;
  const win_rate = games_played ? wins / games_played : 0;

  // --------------------------------------------------------------
  // Withdrawals
  // --------------------------------------------------------------
  const { data: withdrawals } = await supabase
    .from("withdrawals")
    .select(
      "id, amount, points_deducted, payment_method, payment_details, status, requested_at, processed_at"
    )
    .eq("user_id", userId)
    .order("requested_at", { ascending: false })
    .limit(10);

  const recent_withdrawals = (withdrawals ?? []).map((w) => ({
    ...w,
    amount: Number(w.amount ?? 0),
    points_deducted: Number(w.points_deducted ?? 0),
    user_name: displayName,
  }));

  // --------------------------------------------------------------
  // Attempts + Points History
  // --------------------------------------------------------------
  const { data: attempts } = await supabase
    .from("game_attempts")
    .select(
      "id, question_id, selected_option_id, is_correct, points_earned, attempted_at"
    )
    .eq("user_id", userId)
    .order("attempted_at", { ascending: false });

  const points_history = (attempts ?? []).map((a) => ({
    question_id: a.question_id,
    points_earned: Number(a.points_earned ?? 0),
    is_correct: a.is_correct,
    attempted_at: a.attempted_at,
  }));

  const recent_attempts = points_history.slice(0, 10);

  // --------------------------------------------------------------
  // Final payload
  // --------------------------------------------------------------
  const payload = {
    id: profile.id,
    name: displayName,
    email: profile.email,
    created_at: profile.created_at,
    total_points,
    total_points_earned,
    total_points_used,
    available_points: total_points,
    games_played,
    wins,
    losses,
    win_rate,
    total_withdrawn,
    total_withdrawals_completed,
    recent_withdrawals,
    recent_attempts,
    points_history,
  };

  return NextResponse.json(payload);
}
