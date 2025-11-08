"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { startGameSession, endGameSession } from "@/lib/game-session-helper"

interface Question {
  id: string
  question_text: string
  category: string
  category_id: string
  difficulty: string
  points: number
  options: Array<{
    id: string
    option_text: string
  }>
}

interface Category {
  id: string
  name: string
  icon_emoji: string
  color_code: string
}

interface GameState {
  score: number
  currentIndex: number
  questions: Question[]
  sessionId: string
  categoryId: string | null
}

const QUESTIONS_PER_GAME = 15 // Number of questions per game

export default function GamePlay() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryId = searchParams.get("category")

  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null)
  const [gameFinished, setGameFinished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showAd, setShowAd] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showRetryButton, setShowRetryButton] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [isValidating, setIsValidating] = useState(false)

  // Countdown timer effect
  useEffect(() => {
    if (showAd && !isCorrect && !showRetryButton) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setShowRetryButton(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showAd, isCorrect, showRetryButton])

  // Load ad script when ad is shown
  useEffect(() => {
    if (showAd && !isCorrect) {
      // Remove existing script and container if any
      const existingScript = document.getElementById('ad-script')
      if (existingScript) {
        existingScript.remove()
      }
      
      const existingContainer = document.getElementById('container-7fd7d00e06123469439fcfd76d66cddf')
      if (existingContainer) {
        existingContainer.innerHTML = ''
      }

      // Create and append new script
      const script = document.createElement('script')
      script.id = 'ad-script'
      script.src = '//pl28003001.effectivegatecpm.com/7fd7d00e06123469439fcfd76d66cddf/invoke.js'
      script.async = true
      script.setAttribute('data-cfasync', 'false')
      document.body.appendChild(script)

      return () => {
        const scriptToRemove = document.getElementById('ad-script')
        if (scriptToRemove) {
          scriptToRemove.remove()
        }
      }
    }
  }, [showAd, isCorrect])

  useEffect(() => {
    const initGame = async () => {
      const supabase = createClient()

      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData.user) {
          router.push("/player/login")
          return
        }

        setUser({ id: authData.user.id, email: authData.user.email || "" })

        // Check if we're restoring from a saved state
        const savedState = typeof window !== 'undefined' ? sessionStorage.getItem('gameState') : null
        
        if (savedState) {
          // Restore from saved state
          const gameState: GameState = JSON.parse(savedState)
          setScore(gameState.score)
          setCurrentIndex(gameState.currentIndex)
          setQuestions(gameState.questions)
          setSessionId(gameState.sessionId)
          
          // Reset answer states - user will answer fresh
          setAnswered(false)
          setSelectedAnswer(null)
          setCorrectAnswer(null)
          setIsCorrect(null)
          
          // Load category if exists
          if (gameState.categoryId) {
            const { data: catData, error: catError } = await supabase
              .from("categories")
              .select("*")
              .eq("id", gameState.categoryId)
              .single()

            if (!catError && catData) {
              setCurrentCategory(catData)
            }
          }
          
          // Clear the saved state
          sessionStorage.removeItem('gameState')
          setLoading(false)
          return
        }

        // Start new game session
        const session = await startGameSession(categoryId || undefined)
        setSessionId(session.id)

        // Fetch ALL questions first to shuffle them properly
        let query = supabase.from("questions").select("*")

        if (categoryId) {
          query = query.eq("category_id", categoryId)
        }

        const { data: questionsData, error: qError } = await query

        if (qError) throw qError

        // Shuffle ALL questions first, then take only the limit
        const shuffledQuestions = questionsData.sort(() => Math.random() - 0.5)
        const limitedQuestions = shuffledQuestions.slice(0, QUESTIONS_PER_GAME)

        const questionsWithOptions = await Promise.all(
          limitedQuestions.map(async (q) => {
            // SECURITY: Don't fetch is_correct field
            const { data: options, error: oError } = await supabase
              .from("question_options")
              .select("id, option_text, display_order")
              .eq("question_id", q.id)
              .order("display_order")

            if (oError) throw oError

            const shuffledOptions = [...options].sort(() => Math.random() - 0.5)

            return { ...q, options: shuffledOptions }
          }),
        )

        if (categoryId) {
          const { data: catData, error: catError } = await supabase
            .from("categories")
            .select("*")
            .eq("id", categoryId)
            .single()

          if (!catError && catData) {
            setCurrentCategory(catData)
          }
        }

        setQuestions(questionsWithOptions)
      } catch (error) {
        console.error("Error loading game:", error)
        router.push("/player/dashboard")
      } finally {
        setLoading(false)
      }
    }

    initGame()

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if this is an intentional reload
      const isIntentional = sessionStorage.getItem('intentionalReload')
      if (isIntentional) {
        sessionStorage.removeItem('intentionalReload')
        return // Don't show the warning
      }
      
      // Only show warning for accidental navigations
      e.preventDefault()
      e.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [router, categoryId])

  const handleAnswer = async (optionId: string) => {
    if (answered || isValidating) return

    setSelectedAnswer(optionId)
    setIsValidating(true)

    const question = questions[currentIndex]

    try {
      // Get auth token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No active session')
      }

      // Validate answer on server
      const response = await fetch('/api/validate-answer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          questionId: question.id,
          optionId: optionId,
          sessionId: sessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to validate answer')
      }

      const result = await response.json()
      const correctOption = result.isCorrect
      const points = result.points

      setAnswered(true)
      setIsCorrect(correctOption)
      setCorrectAnswer(result.correctOptionId)

      if (correctOption) {
        setScore(score + points)
      } else {
        // Save complete game state before showing ad (but NOT the answer states)
        if (typeof window !== 'undefined' && sessionId) {
          const gameState: GameState = {
            score,
            currentIndex,
            questions, // Save the entire questions array with current order
            sessionId,
            categoryId
          }
          sessionStorage.setItem('gameState', JSON.stringify(gameState))
        }
        setShowAd(true)
        setShowRetryButton(false)
        setCountdown(5)
      }
    } catch (error) {
      console.error("Error validating answer:", error)
      alert("Failed to submit answer. Please try again.")
      setSelectedAnswer(null)
    } finally {
      setIsValidating(false)
    }
  }

  const handleRetry = () => {
    // Mark that this is an intentional reload
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('intentionalReload', 'true')
      window.location.reload()
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1)
      setAnswered(false)
      setSelectedAnswer(null)
      setCorrectAnswer(null)
      setIsCorrect(null)
      setShowAd(false)
      setShowRetryButton(false)
      setCountdown(5)
    } else {
      setGameFinished(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-slate-300 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-600 border-t-primary rounded-full mb-4"></div>
          <p>Loading questions...</p>
        </div>
      </div>
    )
  }

  if (!user || questions.length === 0) return null

  if (gameFinished) {
    const handleFinish = async () => {
      if (sessionId) {
        await endGameSession(sessionId)
      }
      // Clear any saved game state
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('gameState')
      }
      router.push("/player/dashboard")
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 backdrop-blur-sm text-center">
          <CardHeader className="pb-4">
            <div className="text-5xl mb-3">🎉</div>
            <h1 className="text-3xl font-bold text-white">Quiz Complete!</h1>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentCategory && (
              <div className="flex items-center justify-center gap-2 bg-slate-700/30 px-4 py-2 rounded-lg">
                <span className="text-3xl">{currentCategory.icon_emoji}</span>
                <span className="text-slate-300 font-semibold">{currentCategory.name}</span>
              </div>
            )}
            <div>
              <p className="text-slate-300 text-sm mb-2">Final Score</p>
              <p className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {score} pts
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-700/30 p-3 rounded-lg">
                <p className="text-slate-400">Questions</p>
                <p className="text-lg font-semibold text-white">
                  {currentIndex + 1}/{questions.length}
                </p>
              </div>
              <div className="bg-slate-700/30 p-3 rounded-lg">
                <p className="text-slate-400">Accuracy</p>
                <p className="text-lg font-semibold text-white">
                  {questions.length > 0 ? ((score / (questions.length * questions[0].points)) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
            <Button
              onClick={handleFinish}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 to-primary/70 text-white font-semibold h-11"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const question = questions[currentIndex]

  if (showAd && !isCorrect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <h2 className="text-2xl font-bold text-white mb-2">Incorrect Answer</h2>
            <p className="text-slate-400">Watch this ad to unlock your next attempt</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ad Banner */}
            <div className="bg-gradient-to-br from-accent to-accent/80 p-8 rounded-xl text-center border-2 border-accent/50">
              <div id="container-7fd7d00e06123469439fcfd76d66cddf"></div>
            </div>

            <div className="space-y-3">
              <p className="text-slate-300 text-center font-semibold">Thanks for watching! You can now try again.</p>
              {showRetryButton ? (
                <Button
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 to-primary/70 text-white font-semibold h-11 transition-all animate-fade-in"
                >
                  Try Again
                </Button>
              ) : (
                <div className="text-center text-slate-400 text-sm py-3">
                  Please wait... ({countdown}s)
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <div className="mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {currentCategory && (
                <>
                  <span className="text-2xl">{currentCategory.icon_emoji}</span>
                  <span className="text-slate-300 font-semibold">{currentCategory.name}</span>
                </>
              )}
            </div>
            <span className="text-accent font-bold">Score: {score}</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">
                Question {currentIndex + 1}/{questions.length}
              </span>
              <span className="text-slate-400">{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <h2 className="text-xl font-bold text-white mb-2">{question.question_text}</h2>
            <p className="text-slate-400 text-sm flex items-center gap-3 flex-wrap">
              <span>
                Difficulty:{" "}
                <span
                  className={`font-semibold ${
                    question.difficulty === "Hard"
                      ? "text-red-400"
                      : question.difficulty === "Medium"
                        ? "text-amber-400"
                        : "text-green-400"
                  }`}
                >
                  {question.difficulty}
                </span>
              </span>
              <span>
                Points: <span className="font-semibold text-accent">{question.points}</span>
              </span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, idx) => {
              const isSelected = selectedAnswer === option.id
              const isCorrectOption = correctAnswer === option.id
              const showAsCorrect = answered && isCorrectOption
              const showAsWrong = answered && isSelected && !isCorrectOption

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option.id)}
                  disabled={answered || isValidating}
                  className={`w-full p-4 text-left rounded-lg font-medium transition-all border-2 ${
                    isValidating && isSelected
                      ? "bg-slate-700/60 border-slate-500 text-slate-300 cursor-wait"
                      : !answered
                      ? "bg-slate-700/40 border-slate-600 hover:border-primary/50 hover:bg-slate-700/60 text-white cursor-pointer"
                      : showAsCorrect
                      ? "bg-green-900/50 border-green-600 text-green-100"
                      : showAsWrong
                      ? "bg-red-900/50 border-red-600 text-red-100"
                      : "bg-slate-700/30 border-slate-600 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        showAsCorrect
                          ? "bg-green-600 text-white"
                          : showAsWrong
                          ? "bg-red-600 text-white"
                          : "bg-slate-600 text-slate-300"
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span>{option.option_text}</span>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {answered && isCorrect && (
          <Button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 to-primary/70 text-white font-semibold h-12 rounded-lg transition-all"
          >
            {currentIndex + 1 < questions.length ? "Next Question" : "Finish Quiz"}
          </Button>
        )}
      </div>
    </div>
  )
}