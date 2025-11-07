import { createClient } from "@/lib/supabase/client"

export async function startGameSession(categoryId?: string) {
  const supabase = createClient()

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) throw new Error("Not authenticated")

    await supabase
      .from("game_sessions")
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq("user_id", userData.user.id)
      .eq("is_active", true)

    const { data, error } = await supabase
      .from("game_sessions")
      .insert({
        user_id: userData.user.id,
        category_id: categoryId || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error starting game session:", error)
    throw error
  }
}

export async function endGameSession(sessionId: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("game_sessions")
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (error) throw error
  } catch (error) {
    console.error("Error ending game session:", error)
    throw error
  }
}

export async function getActiveSession() {
  const supabase = createClient()

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return null

    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error getting active session:", error)
    return null
  }
}
