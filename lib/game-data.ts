export interface Question {
  id: string
  question: string
  choices: string[]
  correctAnswer: number
  category: string
  difficulty: "easy" | "medium" | "hard"
  points: number
}

export const questions: Question[] = [
  {
    id: "1",
    question: "What is the capital of the Philippines?",
    choices: ["Manila", "Cebu", "Davao", "Quezon City"],
    correctAnswer: 0,
    category: "Geography",
    difficulty: "easy",
    points: 10,
  },
  {
    id: "2",
    question: "Which city hosted the 2019 SEA Games?",
    choices: ["Makati", "Manila", "Quezon City", "Pasay"],
    correctAnswer: 1,
    category: "Sports",
    difficulty: "medium",
    points: 20,
  },
  {
    id: "3",
    question: "In what year did the Philippines gain independence from Spain?",
    choices: ["1896", "1898", "1901", "1935"],
    correctAnswer: 1,
    category: "History",
    difficulty: "hard",
    points: 30,
  },
  {
    id: "4",
    question: "Which is the longest river in the Philippines?",
    choices: ["Cagayan River", "Pasig River", "Rio Grande de Mindanao", "Abra River"],
    correctAnswer: 0,
    category: "Geography",
    difficulty: "medium",
    points: 20,
  },
  {
    id: "5",
    question: "What is the most populous city in the Philippines?",
    choices: ["Cebu", "Davao", "Quezon City", "Caloocan"],
    correctAnswer: 2,
    category: "Geography",
    difficulty: "easy",
    points: 10,
  },
]

export interface GameAttempt {
  userId: string
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
  points: number
  timestamp: number
}

// In-memory game attempts storage (replace with database in production)
export const gameAttempts: GameAttempt[] = []

export function saveGameAttempt(attempt: GameAttempt) {
  gameAttempts.push(attempt)
}

export function getPlayerStats(userId: string) {
  const playerAttempts = gameAttempts.filter((a) => a.userId === userId)
  const correctAnswers = playerAttempts.filter((a) => a.isCorrect).length
  const totalPoints = playerAttempts.reduce((sum, a) => sum + (a.points || 0), 0)

  return {
    totalQuestions: playerAttempts.length,
    correctAnswers,
    accuracy: playerAttempts.length > 0 ? ((correctAnswers / playerAttempts.length) * 100).toFixed(1) : 0,
    totalPoints,
  }
}

export function getLeaderboard() {
  const playerStats: Record<string, any> = {}

  gameAttempts.forEach((attempt) => {
    if (!playerStats[attempt.userId]) {
      playerStats[attempt.userId] = { totalPoints: 0, correctAnswers: 0, totalQuestions: 0 }
    }
    playerStats[attempt.userId].totalPoints += attempt.points || 0
    if (attempt.isCorrect) playerStats[attempt.userId].correctAnswers++
    playerStats[attempt.userId].totalQuestions++
  })

  return Object.entries(playerStats)
    .map(([userId, stats]) => ({
      userId,
      ...stats,
      accuracy: ((stats.correctAnswers / stats.totalQuestions) * 100).toFixed(1),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10)
}

export function getAdminStats() {
  const totalAttempts = gameAttempts.length
  const totalPlayers = new Set(gameAttempts.map((a) => a.userId)).size
  const totalCorrect = gameAttempts.filter((a) => a.isCorrect).length
  const overallAccuracy = totalAttempts > 0 ? ((totalCorrect / totalAttempts) * 100).toFixed(1) : 0

  const questionStats = questions.map((q) => {
    const attempts = gameAttempts.filter((a) => a.questionId === q.id)
    const correct = attempts.filter((a) => a.isCorrect).length
    return {
      questionId: q.id,
      question: q.question,
      totalAttempts: attempts.length,
      correctAnswers: correct,
      accuracy: attempts.length > 0 ? ((correct / attempts.length) * 100).toFixed(1) : 0,
    }
  })

  return {
    totalAttempts,
    totalPlayers,
    overallAccuracy,
    questionStats,
  }
}
