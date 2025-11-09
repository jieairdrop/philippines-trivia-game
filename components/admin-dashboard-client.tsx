"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts"
import { TrendingUp, TrendingDown, Users, Target, FileQuestion, Activity as ActivityIcon, Award, Clock, Settings, LayoutDashboard, Users2, LogOut, ChevronDown, Wallet2, Database, HelpCircle, FolderOpen, List, Gift } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"

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
  created_at?: string
}

interface AdminDashboardClientProps {
  stats: AdminStats | null
  activity: Activity[]
  userEmail: string
  adminName?: string
}

export default function AdminDashboardClient({ stats, activity, userEmail, adminName }: AdminDashboardClientProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Calculate correct and incorrect counts
  const correctCount = stats
    ? Math.round((Number.parseInt(stats.overallAccuracy as string) / 100) * stats.totalAttempts)
    : 0
  const incorrectCount = stats ? stats.totalAttempts - correctCount : 0

  const accuracyData = [
    { name: "Correct", value: correctCount, fill: "#22c55e" },
    { name: "Incorrect", value: incorrectCount, fill: "#ef4444" },
  ]

  // Sort questions by accuracy for insights
  const sortedByAccuracy = stats?.questionStats
    ? [...stats.questionStats].sort((a, b) => Number.parseFloat(a.accuracy) - Number.parseFloat(b.accuracy))
    : []

  const easiestQuestions = sortedByAccuracy.slice(-3).reverse()
  const hardestQuestions = sortedByAccuracy.slice(0, 3)

  // Calculate average points
  const avgPoints = activity.length > 0
    ? (activity.reduce((sum, act) => sum + act.points_earned, 0) / activity.length).toFixed(1)
    : "0"

  // Performance trend data (mock - you can replace with real data)
  const performanceTrend = stats?.questionStats.slice(0, 7).map((q, idx) => ({
    name: `Q${idx + 1}`,
    accuracy: Number.parseFloat(q.accuracy),
    attempts: q.totalAttempts,
  })) || []

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.substring(0, 2).toUpperCase() || "AD"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-[32rem] h-[32rem] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900/95 to-blue-900/95 border-b border-slate-800/50 backdrop-blur-xl shadow-2xl py-6 sticky top-0 z-50">
        <div className="max-w-[90rem] mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {adminName || userEmail}
              </p>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/70 transition-all duration-300 shadow-lg"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white font-bold text-sm">{getInitials(adminName, userEmail)}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white">{adminName || "Admin"}</p>
                <p className="text-xs text-slate-400 truncate max-w-[120px]">{userEmail}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/50 rounded-xl shadow-2xl shadow-slate-950/50 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                {/* User Info Section */}
                <div className="px-4 py-3 border-b border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-transparent">
                  <p className="text-sm font-semibold text-white">{adminName || "Administrator"}</p>
                  <p className="text-xs text-slate-400 truncate mt-1">{userEmail}</p>
                </div>

                {/* Main Navigation */}
                <div className="py-2 px-2 space-y-1">
                  <Link href="/admin">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-blue-950/50 transition-all duration-200 text-sm font-medium group">
                      <LayoutDashboard className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      Admin Home
                    </button>
                  </Link>

                  <Link href="/admin/dashboard">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-950/50 transition-all duration-200 text-sm font-medium group">
                      <LayoutDashboard className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                      Full Dashboard
                    </button>
                  </Link>
                </div>

                {/* Divider */}
                <div className="px-2 py-1">
                  <div className="h-px bg-slate-800/50"></div>
                </div>

                {/* Management Section */}
                <div className="px-2 py-1">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Management
                  </div>
                </div>

                <div className="py-2 px-2 space-y-1">
                  <Link href="/admin/manage">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-purple-950/50 transition-all duration-200 text-sm font-medium group">
                      <Database className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      Database Hub
                    </button>
                  </Link>

                  <Link href="/admin/manage/users">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-blue-950/50 transition-all duration-200 text-sm font-medium group">
                      <Users2 className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      Users
                    </button>
                  </Link>

                  <Link href="/admin/manage/categories">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-purple-950/50 transition-all duration-200 text-sm font-medium group">
                      <FolderOpen className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      Categories
                    </button>
                  </Link>

                  <Link href="/admin/manage/questions">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-green-950/50 transition-all duration-200 text-sm font-medium group">
                      <HelpCircle className="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" />
                      Questions
                    </button>
                  </Link>

                  <Link href="/admin/manage/options">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-yellow-950/50 transition-all duration-200 text-sm font-medium group">
                      <List className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                      Options
                    </button>
                  </Link>

                  <Link href="/admin/manage/attempts">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-orange-950/50 transition-all duration-200 text-sm font-medium group">
                      <Target className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
                      Attempts
                    </button>
                  </Link>

                  <Link href="/admin/manage/referrals">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-pink-950/50 transition-all duration-200 text-sm font-medium group">
                      <Gift className="w-4 h-4 text-pink-400 group-hover:text-pink-300 transition-colors" />
                      Referrals
                    </button>
                  </Link>

                  <Link href="/admin/withdrawals">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-emerald-950/50 transition-all duration-200 text-sm font-medium group">
                      <Wallet2 className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                      Withdrawals
                    </button>
                  </Link>
                </div>

                {/* Divider */}
                <div className="px-2 py-1">
                  <div className="h-px bg-slate-800/50"></div>
                </div>

                {/* Settings & Logout */}
                <div className="py-2 px-2 space-y-1">
                  <Link href="/admin/settings">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 text-sm font-medium group">
                      <Settings className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                      Settings
                    </button>
                  </Link>

                  <form action="/auth/logout" method="POST" className="w-full">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-950/50 transition-all duration-200 text-sm font-medium group"
                    >
                      <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" />
                      Logout
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[90rem] mx-auto px-6 py-8 relative z-10">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-blue-800/30 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-2">
                {stats?.totalPlayers || 0}
              </div>
              <p className="text-xs text-blue-300/70 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Active users
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 border-purple-800/30 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4" />
                Total Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-2">
                {stats?.totalAttempts || 0}
              </div>
              <p className="text-xs text-purple-300/70 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                All time
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-emerald-800/30 backdrop-blur-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-200 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Overall Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-2">
                {stats?.overallAccuracy}%
              </div>
              <p className="text-xs text-emerald-300/70 flex items-center gap-1">
                {Number.parseFloat(stats?.overallAccuracy || "0") >= 70 ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    Excellent performance
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    Room for improvement
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border-cyan-800/30 backdrop-blur-sm hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-cyan-200 flex items-center gap-2">
                <FileQuestion className="w-4 h-4" />
                Total Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-2">
                {stats?.questionStats.length || 0}
              </div>
              <p className="text-xs text-cyan-300/70 flex items-center gap-1">
                <Award className="w-3 h-3" />
                In question bank
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Average Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {avgPoints} pts
              </div>
              <p className="text-slate-400 text-sm mt-1">Per attempt</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Correct Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {correctCount}
              </div>
              <p className="text-slate-400 text-sm mt-1">Out of {stats?.totalAttempts || 0} attempts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Incorrect Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">
                {incorrectCount}
              </div>
              <p className="text-slate-400 text-sm mt-1">Out of {stats?.totalAttempts || 0} attempts</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Accuracy Pie Chart */}
          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Answer Distribution</CardTitle>
              <CardDescription className="text-slate-400">Overall correct vs incorrect ratio</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={accuracyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => {
                      const percent = entry.percent || 0
                      return `${entry.name}: ${entry.value} (${(Number(percent) * 100).toFixed(1)}%)`
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {accuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Trend */}
          <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-xl">Performance Trend</CardTitle>
              <CardDescription className="text-slate-400">Accuracy across questions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155ff",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Question Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Easiest Questions */}
          <Card className="bg-gradient-to-br from-emerald-950/40 to-slate-950/60 border-emerald-900/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Top Performing Questions
              </CardTitle>
              <CardDescription className="text-slate-400">Highest accuracy rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {easiestQuestions.map((q, idx) => (
                  <div key={q.questionId} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-emerald-900/20 hover:border-emerald-800/40 transition-all">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate mb-1">{q.question}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-400 font-bold">{q.accuracy}% accuracy</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{q.totalAttempts} attempts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hardest Questions */}
          <Card className="bg-gradient-to-br from-red-950/40 to-slate-950/60 border-red-900/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Challenging Questions
              </CardTitle>
              <CardDescription className="text-slate-400">Lowest accuracy rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hardestQuestions.map((q, idx) => (
                  <div key={q.questionId} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-red-900/20 hover:border-red-800/40 transition-all">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate mb-1">{q.question}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-red-400 font-bold">{q.accuracy}% accuracy</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{q.totalAttempts} attempts</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Performance Bar Chart */}
        <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-white text-xl">Question Performance Overview</CardTitle>
            <CardDescription className="text-slate-400">Accuracy comparison across all questions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats?.questionStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="question"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                />
                <YAxis stroke="#94a3b8" label={{ value: "Accuracy (%)", angle: -90, position: "insideLeft", fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: any) => [`${value}%`, "Accuracy"]}
                />
                <Bar dataKey="accuracy" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Question Performance Table */}
        <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-white text-xl">Detailed Question Statistics</CardTitle>
            <CardDescription className="text-slate-400">Complete breakdown of all questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-4 px-4 text-slate-300 font-semibold text-sm uppercase tracking-wider">
                      Question
                    </th>
                    <th className="text-center py-4 px-4 text-slate-300 font-semibold text-sm uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="text-center py-4 px-4 text-slate-300 font-semibold text-sm uppercase tracking-wider">
                      Correct
                    </th>
                    <th className="text-center py-4 px-4 text-slate-300 font-semibold text-sm uppercase tracking-wider">
                      Incorrect
                    </th>
                    <th className="text-center py-4 px-4 text-slate-300 font-semibold text-sm uppercase tracking-wider">
                      Accuracy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.questionStats.map((q, idx) => {
                    const accuracy = Number.parseFloat(q.accuracy)
                    const incorrect = q.totalAttempts - q.correctAnswers
                    return (
                      <tr key={q.questionId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4 text-white">{q.question}</td>
                        <td className="text-center py-4 px-4 text-slate-300 font-medium">{q.totalAttempts}</td>
                        <td className="text-center py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-900/50 text-emerald-300 font-semibold text-sm">
                            {q.correctAnswers}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-950/50 border border-red-900/50 text-red-300 font-semibold text-sm">
                            {incorrect}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex-1 max-w-[100px] h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  accuracy >= 70
                                    ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                    : accuracy >= 50
                                    ? "bg-gradient-to-r from-yellow-500 to-orange-400"
                                    : "bg-gradient-to-r from-red-500 to-red-400"
                                }`}
                                style={{ width: `${accuracy}%` }}
                              ></div>
                            </div>
                            <span
                              className={`font-bold text-sm min-w-[45px] ${
                                accuracy >= 70
                                  ? "text-emerald-400"
                                  : accuracy >= 50
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {q.accuracy}%
                            </span>
                          </div>
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
        <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-blue-400" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-slate-400">Latest player attempts and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.length > 0 ? (
                activity.map((act) => (
                  <div
                    key={act.id}
                    className="flex justify-between items-center bg-gradient-to-r from-slate-800/40 to-transparent p-4 rounded-xl border border-slate-800/50 hover:border-slate-700/70 hover:bg-slate-800/60 transition-all duration-300 cursor-default group"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors truncate">
                        {act.user_id}
                      </p>
                      <p className="text-slate-400 text-xs mt-1 truncate">{act.questions?.question_text || "Question"}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                          act.is_correct
                            ? "bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 group-hover:bg-emerald-900/80 group-hover:border-emerald-700/70 group-hover:shadow-lg group-hover:shadow-emerald-500/20"
                            : "bg-red-950/70 border border-red-800/50 text-red-300 group-hover:bg-red-900/80 group-hover:border-red-700/70 group-hover:shadow-lg group-hover:shadow-red-500/20"
                        }`}
                      >
                        {act.is_correct ? "✓ Correct" : "✗ Incorrect"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-950/70 to-purple-950/70 border border-blue-800/50 text-blue-300 font-bold text-sm min-w-[80px] justify-center group-hover:from-blue-900/80 group-hover:to-purple-900/80 group-hover:border-blue-700/70 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                        <Award className="w-3.5 h-3.5" />
                        {act.points_earned}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <ActivityIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg font-medium">No activity recorded yet</p>
                  <p className="text-slate-600 text-sm mt-1">Player attempts will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}