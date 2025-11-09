"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Pencil, Trash2, RefreshCw, ArrowLeft, CheckCircle, XCircle, ChevronDown, LayoutDashboard, Users2, LogOut, Database, HelpCircle, FolderOpen, List as ListIcon, Settings, Wallet2, Gift, Target, Award } from "lucide-react"

interface QuestionOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  display_order: number
  created_at: string
}

interface Question {
  id: string
  question_text: string
  category: string
  difficulty: string
}

export default function OptionsManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState<QuestionOption[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(searchParams.get("question") || "")
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [difficultyFilter, setDifficultyFilter] = useState("All")
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState<QuestionOption | null>(null)
  const [formData, setFormData] = useState<any>({})
  
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
    if (selectedQuestionId && questions.length > 0) {
      const question = questions.find(q => q.id === selectedQuestionId)
      setSelectedQuestion(question || null)
      fetchOptionsForQuestion(selectedQuestionId)
    }
  }, [selectedQuestionId, questions])

  const categories = useMemo(() => {
    return [...new Set(questions.map(q => q.category))].sort()
  }, [questions])

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "All" || q.category === categoryFilter
      const matchesDifficulty = difficultyFilter === "All" || q.difficulty === difficultyFilter
      return matchesSearch && matchesCategory && matchesDifficulty
    })
  }, [questions, searchTerm, categoryFilter, difficultyFilter])

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

    await fetchQuestions()
    setLoading(false)
  }

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("id, question_text, category, difficulty")
        .order("created_at", { ascending: false })

      if (error) throw error
      setQuestions(data || [])
      // Reset filters if needed, but keep current
    } catch (err: any) {
      setError("Failed to fetch questions")
    }
  }

  const fetchOptionsForQuestion = async (questionId: string) => {
    setError("")
    try {
      const { data, error } = await supabase
        .from("question_options")
        .select("*")
        .eq("question_id", questionId)
        .order("display_order", { ascending: true })

      if (error) throw error
      setOptions(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch options")
    }
  }

  const openDialog = (item: QuestionOption | null = null) => {
    setCurrentItem(item)
    setEditMode(!!item)
    setFormData(item || { 
      question_id: selectedQuestionId,
      is_correct: false,
      display_order: options.length + 1
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    
    if (!formData.option_text || !formData.question_id) {
      setError("Option text and question are required")
      return
    }
    
    try {
      if (editMode && currentItem) {
        const { error } = await supabase
          .from("question_options")
          .update({
            option_text: formData.option_text,
            is_correct: formData.is_correct,
            display_order: formData.display_order
          })
          .eq("id", currentItem.id)

        if (error) throw error
        setSuccess("Option updated successfully")
      } else {
        const { error } = await supabase
          .from("question_options")
          .insert({
            question_id: formData.question_id,
            option_text: formData.option_text,
            is_correct: formData.is_correct,
            display_order: formData.display_order
          })

        if (error) throw error
        setSuccess("Option created successfully")
      }
      
      setDialogOpen(false)
      await fetchOptionsForQuestion(selectedQuestionId)
    } catch (err: any) {
      setError(err.message || "Failed to save option")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this option?")) return

    setError("")
    setSuccess("")
    
    try {
      const { error } = await supabase.from("question_options").delete().eq("id", id)
      if (error) throw error
      
      setSuccess("Option deleted successfully")
      await fetchOptionsForQuestion(selectedQuestionId)
    } catch (err: any) {
      setError(err.message || "Failed to delete option")
    }
  }

  const handleQuestionChange = (questionId: string) => {
    setSelectedQuestionId(questionId)
    router.push(`/admin/manage/options?question=${questionId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
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
              <ListIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Question Options Management
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
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white bg-yellow-950/50 transition-all duration-200 text-sm font-medium group">
                      <ListIcon className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
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

        {/* Question Selector */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-slate-300">Select Question ({filteredQuestions.length} found)</Label>
              <Button 
                onClick={fetchQuestions} 
                variant="outline" 
                size="sm"
                className="bg-slate-700/50 border-slate-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Questions
              </Button>
            </div>
            
            {/* Filters */}
            <div className="space-y-3 mb-4">
              <Input 
                placeholder="Search questions by text..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="All">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="All Difficulties" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="All">All Difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Select value={selectedQuestionId} onValueChange={handleQuestionChange}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Choose a question to manage its options" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600 max-h-80">
                {filteredQuestions.length === 0 ? (
                  <SelectItem value="" disabled>No questions match your filters</SelectItem>
                ) : (
                  filteredQuestions.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          q.difficulty === 'easy' ? 'bg-green-900/30 text-green-300' : 
                          q.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-300' : 
                          'bg-red-900/30 text-red-300'
                        }`}>
                          {q.difficulty}
                        </span>
                        <span className="text-slate-200">{q.question_text.substring(0, 80)}...</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {selectedQuestion && (
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedQuestion.difficulty === 'easy' ? 'bg-green-900/30 text-green-300' : 
                    selectedQuestion.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-300' : 
                    'bg-red-900/30 text-red-300'
                  }`}>
                    {selectedQuestion.difficulty}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-300">
                    {selectedQuestion.category}
                  </span>
                </div>
                <p className="text-white text-lg">{selectedQuestion.question_text}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options List */}
        {selectedQuestionId ? (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="text-slate-300">
                  {options.length} option{options.length !== 1 ? 's' : ''} 
                  {options.filter(o => o.is_correct).length > 0 && (
                    <span className="ml-2 text-green-400">
                      ({options.filter(o => o.is_correct).length} correct)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => fetchOptionsForQuestion(selectedQuestionId)} 
                    variant="outline" 
                    className="bg-slate-700/50 border-slate-600 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={() => openDialog()} className="bg-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>

              {options.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="mb-2">No options added yet</p>
                  <p className="text-sm">Add at least 2 options (one correct answer)</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <Card 
                      key={option.id} 
                      className={`border-2 transition-all ${
                        option.is_correct 
                          ? 'bg-green-900/20 border-green-700' 
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white font-semibold flex-shrink-0">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1">
                              <p className="text-white text-lg mb-1">{option.option_text}</p>
                              <div className="flex items-center gap-2">
                                {option.is_correct ? (
                                  <span className="flex items-center gap-1 text-green-300 text-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    Correct Answer
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-slate-400 text-sm">
                                    <XCircle className="h-4 w-4" />
                                    Incorrect
                                  </span>
                                )}
                                <span className="text-slate-500 text-xs">
                                  • Order: {option.display_order}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDialog(option)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(option.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {options.length > 0 && options.filter(o => o.is_correct).length === 0 && (
                <Alert className="mt-4 bg-yellow-900/20 border-yellow-700">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-200">
                    Warning: No correct answer marked. Please mark at least one option as correct.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <p className="text-slate-400 text-lg">Please select a question to manage its options</p>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit" : "Create"} Option</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editMode ? "Update option details" : "Add a new answer option"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="option_text" className="text-slate-300">Option Text *</Label>
              <Textarea
                id="option_text"
                value={formData.option_text || ""}
                onChange={(e) => setFormData({...formData, option_text: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter the answer option..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="display_order" className="text-slate-300">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order || 1}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 1})}
                className="bg-slate-700 border-slate-600 text-white"
                min="1"
              />
              <p className="text-xs text-slate-400 mt-1">Order in which this option appears (1, 2, 3, 4)</p>
            </div>
            <div className="flex items-center space-x-2 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <Checkbox
                id="is_correct"
                checked={formData.is_correct ?? false}
                onCheckedChange={(checked) => setFormData({...formData, is_correct: checked})}
              />
              <Label htmlFor="is_correct" className="text-slate-300 cursor-pointer">
                This is the correct answer
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)} 
              className="bg-slate-700 border-slate-600"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary">
              {editMode ? "Save Changes" : "Create Option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}