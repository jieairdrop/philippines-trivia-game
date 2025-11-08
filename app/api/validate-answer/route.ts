import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Safety check for environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing required env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  )
}

// Verify authenticated user
async function verifyUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  
  const token = authHeader.substring(7)

  const supabaseAuth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    data: { user },
    error: authErr,
  } = await supabaseAuth.auth.getUser(token)

  if (authErr || !user) {
    console.error("Auth error:", authErr)
    return null
  }

  return user
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    )
  }

  try {
    // Verify user authentication
    const authHeader = request.headers.get("Authorization")
    const user = await verifyUser(authHeader)
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { questionId, optionId, sessionId } = body

    if (!questionId || !optionId) {
      return NextResponse.json(
        { error: "Missing required fields: questionId and optionId" },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch the selected option with correct answer info
    const { data: option, error: optionError } = await supabase
      .from("question_options")
      .select("is_correct")
      .eq("id", optionId)
      .eq("question_id", questionId)
      .single()

    if (optionError) {
      console.error("Option fetch error:", optionError)
      return NextResponse.json(
        { error: "Invalid answer option" },
        { status: 400 }
      )
    }

    if (!option) {
      return NextResponse.json(
        { error: "Option not found" },
        { status: 404 }
      )
    }

    // Fetch question details for points
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .select("points")
      .eq("id", questionId)
      .single()

    if (questionError) {
      console.error("Question fetch error:", questionError)
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // Calculate points
    const points = option.is_correct ? Number(question.points) : 0

    // Prepare attempt data
    const attemptData: any = {
      user_id: user.id,
      question_id: questionId,
      selected_option_id: optionId,
      is_correct: option.is_correct,
      points_earned: points,
    }

    // Only add session_id if it exists
    if (sessionId) {
      attemptData.session_id = sessionId
    }

    // Save the attempt to database
    const { error: attemptError } = await supabase
      .from("game_attempts")
      .insert(attemptData)

    if (attemptError) {
      console.error("Error saving attempt:", attemptError)
      // Don't fail the request if saving attempt fails - just log it
    }

    // Fetch the correct option ID to show the right answer
    const { data: correctOption, error: correctError } = await supabase
      .from("question_options")
      .select("id")
      .eq("question_id", questionId)
      .eq("is_correct", true)
      .single()

    if (correctError) {
      console.error("Correct option fetch error:", correctError)
    }

    // Return validation result
    return NextResponse.json({
      isCorrect: option.is_correct,
      points: points,
      correctOptionId: correctOption?.id || null,
    })

  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}