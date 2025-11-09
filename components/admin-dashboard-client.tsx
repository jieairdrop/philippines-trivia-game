"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from "recharts"
import { useState, useMemo } from "react"
import { ChevronDown, Search, TrendingUp, Users, FileText, Target, HelpCircle, LogOut } from "lucide-react"

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
  createdAt?: string
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

interface PieLabelProps {
  name: string
  value: number
  percent: number
}

export default function AdminDashboardClient({ 
  stats, 
  activity, 
  userEmail, 
  adminName 
}: AdminDashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "accuracy" | "attempts">("recent")
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null)

  // Calculate accuracy data for pie chart
  const accuracyData = stats
    ? [
        {
          name: "Correct",
          value: Math.floor(
            (Number.parseInt(stats.overallAccuracy as string) / 100) * stats.totalAttempts
          ),
          fill: "#10b981",
        },
        {
          name: "Incorrect",
          value:
            stats.totalAttempts -
            Math.floor(
              (Number.parseInt(stats.overallAccuracy as string) / 100) * stats.totalAttempts
            ),
          fill: "#ef4444",
        },
      ]
    : []

  // Filter and sort activity
  const filteredActivity = useMemo(() => {
    let filtered = activity.filter(
      (act) =>
        act.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.questions?.question_text.toLowerCase().includes(searchQuery.toLowerCase())
    )

    switch (sortBy) {
      case "accuracy":
        return filtered.sort((a, b) => (b.is_correct ? 1 : 0) - (a.is_correct ? 1 : 0))
      case "attempts":
        return filtered.sort((a, b) => b.points_earned - a.points_earned)
      default:
        return filtered
    }
  }, [activity, searchQuery, sortBy])

  // Calculate performance trend
  const performanceTrend = stats?.questionStats
    .sort((a, b) => Number.parseInt(b.accuracy) - Number.parseInt(a.accuracy))
    .slice(0, 5)
    .map((q) => ({
      name: q.question.substring(0, 15) + "...",
      fullName: q.question,
      accuracy: Number.parseInt(q.accuracy),
      attempts: q.totalAttempts,
    })) || []

  const successRate = stats
    ? Number.parseInt(stats.overallAccuracy)
    : 0

  const avgAttemptsPerPlayer = stats
    ? Math.round(stats.totalAttempts / Math.max(stats.totalPlayers, 1))
    : 0

  const renderPieLabel = (props: any) => {
    const { name, value, percent = 0 } = props.payload;
    return `${name}: ${value}
(${(percent * 100).toFixed(0)}%)`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800/80 to-blue-900/80 border-b border-slate-700 backdrop-blur-sm py-6 relative z-20 sticky top-0">
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
              className="border-slate-600 text-white hover:bg-slate-700 bg-transparent cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Players"
            value={stats?.totalPlayers || 0}
            trend={`${stats?.totalPlayers || 0} active`}
            iconColor="text-blue-400"
          />
          <StatCard
            icon={<FileText className="w-6 h-6" />}
            label="Total Attempts"
            value={stats?.totalAttempts || 0}
            trend={`${avgAttemptsPerPlayer} per player`}
            iconColor="text-purple-400"
          />
          <StatCard
            icon={<Target className="w-6 h-6" />}
            label="Overall Accuracy"
            value={`${stats?.overallAccuracy || 0}%`}
            trend={`${successRate >= 70 ? "✓ Good" : "↑ Needs improvement"}`}
            trendColor={successRate >= 70 ? "text-green-400" : "text-yellow-400"}
            iconColor="text-green-400"
          />
          <StatCard
            icon={<HelpCircle className="w-6 h-6" />}
            label="Total Questions"
            value={stats?.questionStats.length || 0}
            trend={`Active in system`}
            iconColor="text-orange-400"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Accuracy Pie Chart */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm lg:col-span-1">
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
                    labelLine={true}
                    label={renderPieLabel}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {accuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => (value as number).toLocaleString()}
                    contentStyle={{ 
                      backgroundColor: "#1e293b", 
                      border: "1px solid #475569",
                      borderRadius: "8px",
                      color: "#f1f5f9"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-300">Correct: {accuracyData[0]?.value || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-slate-300">Incorrect: {accuracyData[1]?.value || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Performance Chart */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Top Questions by Accuracy</CardTitle>
              <CardDescription className="text-slate-400">Hover to see full question text</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={performanceTrend}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    tick={{ fontSize: 12 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#1e293b", 
                      border: "1px solid #475569", 
                      borderRadius: "8px",
                      color: "#f1f5f9",
                      maxWidth: "300px"
                    }}
                    formatter={(value) => `${value}%`}
                    labelFormatter={(label) => {
                      const fullName = performanceTrend.find(q => q.name === label)?.fullName
                      return `${fullName}`
                    }}
                  />
                  <Bar 
                    dataKey="accuracy" 
                    fill="#f59e0b" 
                    radius={[8, 8, 0, 0]}
                    onMouseEnter={(data) => setHoveredQuestion((data.payload as { accuracy: number }).accuracy)}
                    onMouseLeave={() => setHoveredQuestion(null)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Question Performance Table */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">Detailed Question Performance</CardTitle>
            <CardDescription className="text-slate-400">Statistics for every question</CardDescription>
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
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Difficulty</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.questionStats.map((q) => {
                    const acc = Number.parseInt(q.accuracy)
                    const difficulty = acc >= 80 ? "Easy" : acc >= 50 ? "Medium" : "Hard"
                    const diffColor = acc >= 80 ? "text-green-400" : acc >= 50 ? "text-yellow-400" : "text-red-400"

                    return (
                      <tr 
                        key={q.questionId} 
                        className="border-b border-slate-700 hover:bg-slate-700/40 transition"
                        title={q.question}
                      >
                        <td className="py-3 px-4 text-white max-w-xs truncate">{q.question}</td>
                        <td className="text-center py-3 px-4 text-slate-300">{q.totalAttempts}</td>
                        <td className="text-center py-3 px-4 font-semibold text-green-400">
                          {q.correctAnswers}
                        </td>
                        <td className="text-center py-3 px-4 font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {q.accuracy}%
                        </td>
                        <td className={`text-center py-3 px-4 font-semibold ${diffColor}`}>
                          {difficulty}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-slate-400">Latest player attempts</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by user or question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-slate-700/50 border border-slate-600 text-white px-4 py-2 rounded-md pr-8 cursor-pointer hover:border-slate-500 transition"
                >
                  <option value="recent">Recent</option>
                  <option value="accuracy">Accuracy</option>
                  <option value="attempts">Points</option>
                </select>
                <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Activity List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredActivity.length > 0 ? (
                filteredActivity.map((act) => (
                  <ActivityItem key={act.id} activity={act} />
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">No activity found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: string
  trendColor?: string
  iconColor?: string
}

function StatCard({ 
  icon, 
  label, 
  value, 
  trend, 
  trendColor = "text-slate-400",
  iconColor = "text-slate-400"
}: StatCardProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm hover:border-primary/50 transition-colors group">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <div className={`${iconColor} group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
          {value}
        </div>
        {trend && (
          <p className={`text-xs font-medium ${trendColor}`}>
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface ActivityItemProps {
  activity: Activity
}

function ActivityItem({ activity }: ActivityItemProps) {
  const isCorrect = activity.is_correct

  return (
    <div 
      className="flex justify-between items-center bg-gradient-to-r from-slate-700/30 to-transparent p-3 rounded-lg border border-slate-700/50 hover:border-primary/50 hover:bg-slate-700/50 transition-all duration-300 cursor-default group text-sm"
      title={activity.questions?.question_text}
    >
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium group-hover:text-accent transition-colors truncate">
          {activity.user_id}
        </p>
        <p className="text-slate-400 text-xs truncate">
          {activity.questions?.question_text || "Question"}
        </p>
      </div>
      <div className="text-right flex items-center gap-3 ml-4 flex-shrink-0">
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
            isCorrect
              ? "bg-green-900/50 border border-green-700/50 text-green-200 group-hover:bg-green-900/70 group-hover:border-green-600"
              : "bg-red-900/50 border border-red-700/50 text-red-200 group-hover:bg-red-900/70 group-hover:border-red-600"
          }`}
        >
          {isCorrect ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Correct
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Incorrect
            </>
          )}
        </div>
        <span className="text-accent font-bold min-w-12 group-hover:text-accent/80 transition-colors">
          {activity.points_earned} pts
        </span>
      </div>
    </div>
  )
}

// SVG Icons
function CheckCircle({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function XCircle({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  )
}