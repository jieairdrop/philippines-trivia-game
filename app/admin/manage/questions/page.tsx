"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Pencil, Trash2, RefreshCw, Search, ArrowLeft, Eye } from "lucide-react"

interface Question {
  id: string
  question_text: string
  category: string
  difficulty: string
  points: number
  category_id: string
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
}

export default function QuestionsManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState<Question | null>(null)
  const [formData, setFormData] = useState<any>({})
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [searchTerm, difficultyFilter, categoryFilter, questions])

  const checkAuthAndFetch = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      router.push("/admin/login")
      return
    }

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

    await Promise.all([fetchQuestions(), fetchCategories()])
    setLoading(false)
  }

  const fetchQuestions = async () => {
    setError("")
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setQuestions(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch questions")
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      console.error("Failed to fetch categories:", err)
    }
  }

  const filterQuestions = () => {
    let filtered = questions

    if (difficultyFilter !== "all") {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(q => q.category === categoryFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredQuestions(filtered)
  }

  const openDialog = (item: Question | null = null) => {
    setCurrentItem(item)
    setEditMode(!!item)
    setFormData(item || { 
      difficulty: "medium", 
      points: 10,
      category: categories[0]?.name || ""
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    
    if (!formData.question_text || !formData.category) {
      setError("Question text and category are required")
      return
    }
    
    try {
      const saveData = {
        question_text: formData.question_text,
        category: formData.category,
        difficulty: formData.difficulty,
        points: formData.points,
        category_id: formData.category_id || null
      }

      if (editMode && currentItem) {
        const { error } = await supabase
          .from("questions")
          .update(saveData)
          .eq("id", currentItem.id)

        if (error) throw error
        setSuccess("Question updated successfully")
      } else {
        const { error } = await supabase
          .from("questions")
          .insert(saveData)

        if (error) throw error
        setSuccess("Question created successfully. Don't forget to add answer options!")
      }
      
      setDialogOpen(false)
      await fetchQuestions()
    } catch (err: any) {
      setError(err.message || "Failed to save question")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question? This will also delete all associated answer options.")) return

    setError("")
    setSuccess("")
    
    try {
      const { error } = await supabase.from("questions").delete().eq("id", id)
      if (error) throw error
      
      setSuccess("Question deleted successfully")
      await fetchQuestions()
    } catch (err: any) {
      setError(err.message || "Failed to delete question")
    }
  }

  const viewOptions = (questionId: string) => {
    router.push(`/admin/manage/options?question=${questionId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-slate-300">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Questions Management</h1>
            <p className="text-slate-400">Manage trivia questions and their details</p>
          </div>
          <Button 
            onClick={() => router.push("/admin/manage")} 
            variant="outline" 
            className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Management
          </Button>
        </div>

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

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(questions.map(q => q.category))).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full lg:w-48 bg-slate-700 border-slate-600 text-white">
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
                onClick={fetchQuestions} 
                variant="outline" 
                className="bg-slate-700/50 border-slate-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => openDialog()} className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="mb-4 text-slate-300">
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>

            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            question.difficulty === 'easy' ? 'bg-green-900/30 text-green-300' : 
                            question.difficulty === 'medium' ? 'bg-yellow-900/30 text-yellow-300' : 
                            'bg-red-900/30 text-red-300'
                          }`}>
                            {question.difficulty}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-300">
                            {question.category}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-purple-900/30 text-purple-300">
                            {question.points} pts
                          </span>
                        </div>
                        <p className="text-white text-lg mb-2">{question.question_text}</p>
                        <p className="text-slate-400 text-sm">
                          Created: {new Date(question.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewOptions(question.id)}
                          className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Options
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDialog(question)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(question.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredQuestions.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No questions found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit" : "Create"} Question</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editMode ? "Update question details" : "Create a new trivia question"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="question_text" className="text-slate-300">Question Text *</Label>
              <Textarea
                id="question_text"
                value={formData.question_text || ""}
                onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter your trivia question..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-slate-300">Category *</Label>
                <Select 
                  value={formData.category || ""} 
                  onValueChange={(val) => setFormData({...formData, category: val})}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {Array.from(new Set(questions.map(q => q.category))).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty" className="text-slate-300">Difficulty</Label>
                <Select 
                  value={formData.difficulty || "medium"} 
                  onValueChange={(val) => setFormData({...formData, difficulty: val})}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="points" className="text-slate-300">Points</Label>
              <Input
                id="points"
                type="number"
                value={formData.points || 10}
                onChange={(e) => setFormData({...formData, points: parseInt(e.target.value) || 10})}
                className="bg-slate-700 border-slate-600 text-white"
                min="1"
              />
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
              {editMode ? "Save Changes" : "Create Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}