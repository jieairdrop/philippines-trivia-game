import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { questionId, optionId, sessionId } = await request.json()

    if (!questionId || !optionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch the selected option with correct answer info
    const { data: option, error: optionError } = await supabase
      .from("question_options")
      .select("is_correct")
      .eq("id", optionId)
      .eq("question_id", questionId)
      .single()

    if (optionError || !option) {
      return NextResponse.json({ error: "Invalid answer" }, { status: 400 })
    }

    // Fetch question details for points
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("points")
      .eq("id", questionId)
      .single()

    if (questionError || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    // Calculate points
    const points = option.is_correct ? question.points : 0

    // Save the attempt to database
    const { error: attemptError } = await supabase
      .from("game_attempts")
      .insert({
        user_id: user.id,
        question_id: questionId,
        selected_option_id: optionId,
        is_correct: option.is_correct,
        points_earned: points,
        session_id: sessionId || null
      })

    if (attemptError) {
      console.error("Error saving attempt:", attemptError)
    }

    // Fetch the correct option ID to show the right answer
    const { data: correctOption, error: correctError } = await supabase
      .from("question_options")
      .select("id")
      .eq("question_id", questionId)
      .eq("is_correct", true)
      .single()

    return NextResponse.json({
      isCorrect: option.is_correct,
      points: points,
      correctOptionId: correctOption?.id || null
    })

  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}