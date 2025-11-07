import { createClient } from "@/lib/supabase/server"

// 🧠 Get all questions with their options
export async function getQuestionsWithOptions() {
  const supabase = await createClient()

  const { data: questions, error: qError } = await supabase.from("questions").select("*").order("created_at")

  if (qError) throw qError

  const questionsWithOptions = await Promise.all(
    questions.map(async (q) => {
      const { data: options, error: oError } = await supabase
        .from("question_options")
        .select("*")
        .eq("question_id", q.id)
        .order("display_order")

      if (oError) throw oError
      return { ...q, options }
    }),
  )

  return questionsWithOptions
}

// 🎮 Save game attempt
export async function saveAttempt(
  userId: string,
  questionId: string,
  selectedOptionId: string,
  isCorrect: boolean,
  pointsEarned: number,
) {
  const supabase = await createClient()

  const { error } = await supabase.from("game_attempts").insert({
    user_id: userId,
    question_id: questionId,
    selected_option_id: selectedOptionId,
    is_correct: isCorrect,
    points_earned: pointsEarned,
  })

  if (error) throw error
}

// 📊 Get player stats
export async function getPlayerStats(userId: string) {
  const supabase = await createClient()

  const { data: attempts, error } = await supabase.from("game_attempts").select("*").eq("user_id", userId)

  if (error) throw error

  const correctAnswers = attempts.filter((a) => a.is_correct).length
  const totalPoints = attempts.reduce((sum, a) => sum + (a.points_earned || 0), 0)

  return {
    totalAttempts: attempts.length,
    correctAnswers,
    accuracy: attempts.length > 0 ? ((correctAnswers / attempts.length) * 100).toFixed(1) : "0",
    totalPoints,
  }
}

// 🏆 Get leaderboard (Fixed to show all players with names)
export async function getLeaderboard(limit = 10) {
  const supabase = await createClient()

  try {
    const { data: leaderboard, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("total_points", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Leaderboard error:", error.message)
      return []
    }

    console.log("[v0] Leaderboard data:", leaderboard?.length || 0, "players found")
    return leaderboard || []
  } catch (error) {
    console.error("[v0] Exception fetching leaderboard:", error)
    return []
  }
}

// ⚙️ Get admin stats
export async function getAdminStats() {
  const supabase = await createClient()

  const { data: attempts, error: attError } = await supabase.from("game_attempts").select("*")

  if (attError) throw attError

  const { data: profiles, error: profError } = await supabase.from("profiles").select("*").eq("role", "player")

  if (profError) throw profError

  const { data: questions, error: qError } = await supabase.from("questions").select("*")

  if (qError) throw qError

  const totalCorrect = attempts.filter((a) => a.is_correct).length
  const overallAccuracy = attempts.length > 0 ? ((totalCorrect / attempts.length) * 100).toFixed(1) : "0"

  const questionStats = questions.map((q) => {
    const qAttempts = attempts.filter((a) => a.question_id === q.id)
    const correct = qAttempts.filter((a) => a.is_correct).length
    return {
      questionId: q.id,
      question: q.question_text,
      totalAttempts: qAttempts.length,
      correctAnswers: correct,
      accuracy: qAttempts.length > 0 ? ((correct / qAttempts.length) * 100).toFixed(1) : "0",
    }
  })

  return {
    totalAttempts: attempts.length,
    totalPlayers: profiles.length,
    overallAccuracy,
    questionStats,
  }
}

// 🕓 Get recent activity
export async function getRecentActivity(limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("game_attempts")
    .select(`
      id,
      user_id,
      question_id,
      is_correct,
      points_earned,
      attempted_at,
      questions (question_text)
    `)
    .order("attempted_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

// 🏷️ Get top categories safely
export async function getTopCategories(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("game_attempts")
    .select(`
      id,
      questions:questions!inner(
        category_id,
        categories:categories!inner(name, icon_emoji, color_code)
      )
    `)
    .eq("user_id", userId)
    .limit(100)

  if (error) {
    console.error("[v0] Error fetching top categories:", error.message)
    return []
  }

  const categoryStats: Record<string, { name: string; icon_emoji: string; color_code: string; count: number }> = {}

  data?.forEach((attempt: any) => {
    const cat = attempt.questions?.categories
    if (cat) {
      if (!categoryStats[cat.name]) {
        categoryStats[cat.name] = {
          name: cat.name,
          icon_emoji: cat.icon_emoji,
          color_code: cat.color_code,
          count: 0,
        }
      }
      categoryStats[cat.name].count++
    }
  })

  return Object.values(categoryStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
}
