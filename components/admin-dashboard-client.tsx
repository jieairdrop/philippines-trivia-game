"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface AdminStats {
  totalPlayers: number
  totalAttempts: number
  overallAccuracy: string
  questionStats: Array<{
    questionId: number
    question: string
    totalAttempts: number
    correctAnswers: number
    accuracy: string
  }>
}

interface Activity {
  id: string
  user_id: string
  is_correct: boolean
  points_earned: number
  questions?: {
    question_text: string
  }
}

interface AdminDashboardClientProps {
  stats: AdminStats | null
  activity: Activity[]
  userEmail: string
  adminName?: string
}

export default function AdminDashboardClient({ stats, activity, userEmail, adminName }: AdminDashboardClientProps) {
  const accuracyData = stats
    ? [
        {
          name: "Correct",
          value:
            stats.totalAttempts -
            (stats.totalAttempts -
              Math.floor((Number.parseInt(stats.overallAccuracy as string) / 100) * stats.totalAttempts)),
          fill: "#10b981",
        },
        {
          name: "Incorrect",
          value:
            stats.totalAttempts -
            Math.floor((Number.parseInt(stats.overallAccuracy as string) / 100) * stats.totalAttempts),
          fill: "#ef4444",
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800/80 to-blue-900/80 border-b border-slate-700 backdrop-blur-sm py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">{adminName || userEmail}</p>
          </div>
          <form action="/auth/logout" method="POST">
            <Button
              type="submit"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700 bg-transparent cursor-pointer"
            >
              Logout
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <span className="text-xl">👥</span> Total Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {stats?.totalPlayers || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <span className="text-xl">📝</span> Total Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {stats?.totalAttempts || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <span className="text-xl">🎯</span> Overall Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {stats?.overallAccuracy}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <span className="text-xl">❓</span> Total Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {stats?.questionStats.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Accuracy Pie Chart */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Answer Accuracy</CardTitle>
              <CardDescription className="text-slate-400">Correct vs Incorrect</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={accuracyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {accuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Question Difficulty Chart */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Question Performance</CardTitle>
              <CardDescription className="text-slate-400">Top 5 questions by accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.questionStats.slice(0, 5) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="question" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-45} height={80} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                  <Bar dataKey="accuracy" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Question Performance Table */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">Question Performance</CardTitle>
            <CardDescription className="text-slate-400">Detailed stats for each question</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Question</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Attempts</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Correct</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.questionStats.map((q) => (
                    <tr key={q.questionId} className="border-b border-slate-700 hover:bg-slate-700/40 transition">
                      <td className="py-3 px-4 text-white">{q.question}</td>
                      <td className="text-center py-3 px-4 text-slate-300">{q.totalAttempts}</td>
                      <td className="text-center py-3 px-4 font-semibold bg-gradient-to-r from-green-500/10 to-transparent">
                        {q.correctAnswers}
                      </td>
                      <td className="text-center py-3 px-4 font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {q.accuracy}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">Latest player attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activity.length > 0 ? (
                activity.map((act) => (
                  <div
                    key={act.id}
                    className="flex justify-between items-center bg-gradient-to-r from-slate-700/30 to-transparent p-3 rounded-lg border border-slate-700/50 hover:border-primary/50 hover:bg-slate-700/50 transition-all duration-300 cursor-default group text-sm"
                  >
                    <div>
                      <p className="text-white font-medium group-hover:text-accent transition-colors">{act.user_id}</p>
                      <p className="text-slate-400 text-xs">{act.questions?.question_text || "Question"}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ${
                          act.is_correct
                            ? "bg-green-900/50 border border-green-700/50 text-green-200 group-hover:bg-green-900/70 group-hover:border-green-600"
                            : "bg-red-900/50 border border-red-700/50 text-red-200 group-hover:bg-red-900/70 group-hover:border-red-600"
                        }`}
                      >
                        {act.is_correct ? "✓ Correct" : "✗ Incorrect"}
                      </span>
                      <span className="text-accent font-bold min-w-12 group-hover:text-accent/80 transition-colors">
                        {act.points_earned} pts
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">No activity yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
