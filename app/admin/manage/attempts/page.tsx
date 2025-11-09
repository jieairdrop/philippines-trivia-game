"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Search, ArrowLeft, CheckCircle, XCircle, TrendingUp, Award, Target, ChevronDown, LayoutDashboard, Users2, LogOut, Database, HelpCircle, FolderOpen, List, Settings, Wallet2, Gift } from "lucide-react"

interface GameAttempt {
  id: string
  user_id: string
  question_id: string
  selected_option_id: string
  is_correct: boolean
  points_earned: number
  attempted_at: string
  user?: {
    first_name: string
    last_name: string
    email: string
  }
  question?: {
    question_text: string
    category: string
    difficulty: string
  }
}

interface Stats {
  total: number
  correct: number
  incorrect: number
  totalPoints: number
  accuracy: number
}

export default function AttemptsViewerPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<GameAttempt[]>([])
  const [filteredAttempts, setFilteredAttempts] = useState<GameAttempt[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterResult, setFilterResult] = useState("all")
  const [filterDifficulty, setFilterDifficulty] = useState("all")
  const [stats, setStats] = useState<Stats>({
    total: 0,
    correct: 0,
    incorrect: 0,
    totalPoints: 0,
    accuracy: 0
  })
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Header states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Header user data
  const [userEmail, setUserEmail] = useState("")
  const [adminName, setAdminName] = useState("")

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

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  useEffect(() => {
    filterAttempts()
    calculateStats()
  }, [searchTerm, filterResult, filterDifficulty, attempts])

  const checkAuthAndFetch = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      router.push("/admin/login")
      return
    }

    setUserEmail(userData.user.email || "")

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .eq("role", "admin")
      .single()

    if (profileError || !profileData) {
      router.push("/admin/login")
      return
    }

    setAdminName(`${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || userData.user.email || "")

    await fetchAttempts()
    setLoading(false)
  }

  const fetchAttempts = async () => {
    setError("")
    try {
      // Fetch attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("game_attempts")
        .select("*")
        .order("attempted_at", { ascending: false })
        .limit(200)

      if (attemptsError) throw attemptsError

      // Fetch related user data
      const userIds = [...new Set(attemptsData?.map(a => a.user_id) || [])]
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", userIds)

      // Fetch related question data
      const questionIds = [...new Set(attemptsData?.map(a => a.question_id) || [])]
      const { data: questionsData } = await supabase
        .from("questions")
        .select("id, question_text, category, difficulty")
        .in("id", questionIds)

      // Combine data
      const enrichedAttempts = attemptsData?.map(attempt => ({
        ...attempt,
        user: usersData?.find(u => u.id === attempt.user_id),
        question: questionsData?.find(q => q.id === attempt.question_id)
      })) || []

      setAttempts(enrichedAttempts)
    } catch (err: any) {
      setError(err.message || "Failed to fetch attempts")
    }
  }

  const filterAttempts = () => {
    let filtered = attempts

    if (filterResult !== "all") {
      filtered = filtered.filter(a => 
        filterResult === "correct" ? a.is_correct : !a.is_correct
      )
    }

    if (filterDifficulty !== "all") {
      filtered = filtered.filter(a => a.question?.difficulty === filterDifficulty)
    }

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.question?.question_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.question?.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAttempts(filtered)
  }

  const calculateStats = () => {
    const total = filteredAttempts.length
    const correct = filteredAttempts.filter(a => a.is_correct).length
    const incorrect = total - correct
    const totalPoints = filteredAttempts.reduce((sum, a) => sum + a.points_earned, 0)
    const accuracy = total > 0 ? (correct / total) * 100 : 0

    setStats({ total, correct, incorrect, totalPoints, accuracy })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-slate-300">Loading...</div>
      </div>
    )
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
                Game Attempts
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
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white bg-orange-950/50 transition-all duration-200 text-sm font-medium group">
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
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {error && (
          <Alert className="mb-4 bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-900/20 border-green-700">
            <AlertDescription className="text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
            <CardContent className="p-4">
              <div className="text-slate-400 text-sm mb-1">Total Attempts</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-700">
            <CardContent className="p-4">
              <div className="text-green-300 text-sm mb-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Correct
              </div>
              <div className="text-2xl font-bold text-green-400">{stats.correct}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-red-700">
            <CardContent className="p-4">
              <div className="text-red-300 text-sm mb-1 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Incorrect
              </div>
              <div className="text-2xl font-bold text-red-400">{stats.incorrect}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-700">
            <CardContent className="p-4">
              <div className="text-purple-300 text-sm mb-1 flex items-center gap-1">
                <Award className="h-3 w-3" />
                Total Points
              </div>
              <div className="text-2xl font-bold text-purple-400">{stats.totalPoints}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-700">
            <CardContent className="p-4">
              <div className="text-blue-300 text-sm mb-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Accuracy
              </div>
              <div className="text-2xl font-bold text-blue-400">{stats.accuracy.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by player, question, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Select value={filterResult} onValueChange={setFilterResult}>
                <SelectTrigger className="w-full lg:w-40 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="correct">Correct Only</SelectItem>
                  <SelectItem value="incorrect">Incorrect Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-full lg:w-40 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={fetchAttempts} 
                variant="outline" 
                className="bg-slate-700/50 border-slate-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="mb-4 text-slate-300">
              Showing {filteredAttempts.length} of {attempts.length} attempts (latest 200)
            </div>

            <div className="space-y-3">
              {filteredAttempts.map((attempt) => (
                <Card 
                  key={attempt.id} 
                  className={`border-l-4 ${
                    attempt.is_correct 
                      ? 'bg-green-900/10 border-l-green-500' 
                      : 'bg-red-900/10 border-l-red-500'
                  } border-slate-700`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {attempt.is_correct ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                          <span className={`font-semibold ${
                            attempt.is_correct ? 'text-green-300' : 'text-red-300'
                          }`}>
                            {attempt.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-purple-400 font-semibold">
                            +{attempt.points_earned} pts
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            attempt.question?.difficulty === 'easy' ? 'bg-green-900/30 text-green-300' : 
                            attempt.question?.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-300' : 
                            'bg-red-900/30 text-red-300'
                          }`}>
                            {attempt.question?.difficulty}
                          </span>
                        </div>
                        
                        <p className="text-white mb-2">
                          {attempt.question?.question_text || "Question not found"}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>
                            Player: <span className="text-slate-300">
                              {attempt.user?.first_name} {attempt.user?.last_name} 
                              ({attempt.user?.email})
                            </span>
                          </span>
                          <span className="text-slate-500">•</span>
                          <span>
                            Category: <span className="text-slate-300">{attempt.question?.category}</span>
                          </span>
                          <span className="text-slate-500">•</span>
                          <span>{new Date(attempt.attempted_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredAttempts.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No attempts found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}