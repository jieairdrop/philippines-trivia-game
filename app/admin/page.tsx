"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Plus, Pencil, Trash2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

interface Profile {
  id: string
  email: string
  role: string
  first_name: string
  last_name: string
  referral_code: string
  referred_by_code: string
  referral_bonus_points: number
  created_at: string
}

interface Category {
  id: string
  name: string
  description: string
  icon_svg: string
  color_code: string
  display_order: number
  is_active: boolean
  created_at: string
}

interface Question {
  id: string
  question_text: string
  category: string
  difficulty: string
  points: number
  category_id: string
  created_at: string
}

interface QuestionOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  display_order: number
}

interface GameAttempt {
  id: string
  user_id: string
  question_id: string
  selected_option_id: string
  is_correct: boolean
  points_earned: number
  attempted_at: string
}

interface Referral {
  id: string
  referrer_id: string
  referred_user_id: string
  referral_code: string
  bonus_points_awarded: number
  is_rewarded: boolean
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profiles")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Data states
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [options, setOptions] = useState<QuestionOption[]>([])
  const [attempts, setAttempts] = useState<GameAttempt[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!loading) {
      fetchData(activeTab)
    }
  }, [activeTab, loading])

  const checkAuth = async () => {
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

    setLoading(false)
  }

  const fetchData = async (table: string) => {
    setError("")
    try {
      switch (table) {
        case "profiles":
          const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
          setProfiles(profilesData || [])
          break
        case "categories":
          const { data: categoriesData } = await supabase.from("categories").select("*").order("display_order")
          setCategories(categoriesData || [])
          break
        case "questions":
          const { data: questionsData } = await supabase.from("questions").select("*").order("created_at", { ascending: false })
          setQuestions(questionsData || [])
          break
        case "options":
          const { data: optionsData } = await supabase.from("question_options").select("*").order("question_id, display_order")
          setOptions(optionsData || [])
          break
        case "attempts":
          const { data: attemptsData } = await supabase.from("game_attempts").select("*").order("attempted_at", { ascending: false }).limit(100)
          setAttempts(attemptsData || [])
          break
        case "referrals":
          const { data: referralsData } = await supabase.from("referrals").select("*").order("created_at", { ascending: false })
          setReferrals(referralsData || [])
          break
      }
    } catch (err) {
      setError("Failed to fetch data")
    }
  }

  const handleDelete = async (table: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    setError("")
    setSuccess("")
    
    try {
      const { error } = await supabase.from(table).delete().eq("id", id)
      if (error) throw error
      
      setSuccess("Item deleted successfully")
      fetchData(activeTab)
    } catch (err: any) {
      setError(err.message || "Failed to delete item")
    }
  }

  const openDialog = (item: any = null) => {
    setCurrentItem(item)
    setEditMode(!!item)
    setFormData(item || {})
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    
    try {
      let tableName = activeTab
      if (activeTab === "options") tableName = "question_options"
      
      if (editMode) {
        const { error } = await supabase.from(tableName).update(formData).eq("id", currentItem.id)
        if (error) throw error
        setSuccess("Item updated successfully")
      } else {
        const { error } = await supabase.from(tableName).insert(formData)
        if (error) throw error
        setSuccess("Item created successfully")
      }
      
      setDialogOpen(false)
      fetchData(activeTab)
    } catch (err: any) {
      setError(err.message || "Failed to save item")
    }
  }

  const renderTable = (data: any[], columns: { key: string; label: string; render?: (value: any, row: any) => React.ReactNode }[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-700">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left py-3 px-4 text-slate-300 font-semibold">
                  {col.label}
                </th>
              ))}
              <th className="text-left py-3 px-4 text-slate-300 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4 text-slate-200">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDialog(row)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(activeTab === "options" ? "question_options" : activeTab, row.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderForm = () => {
    const updateField = (key: string, value: any) => {
      setFormData((prev: any) => ({ ...prev, [key]: value }))
    }

    switch (activeTab) {
      case "profiles":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                value={formData.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                disabled={editMode}
              />
            </div>
            <div>
              <Label htmlFor="first_name" className="text-slate-300">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => updateField("first_name", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-slate-300">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => updateField("last_name", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-slate-300">Role</Label>
              <Select value={formData.role || "player"} onValueChange={(val) => updateField("role", val)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="referral_bonus_points" className="text-slate-300">Referral Bonus Points</Label>
              <Input
                id="referral_bonus_points"
                type="number"
                value={formData.referral_bonus_points || 0}
                onChange={(e) => updateField("referral_bonus_points", parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        )

      case "categories":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Name</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-slate-300">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="color_code" className="text-slate-300">Color Code</Label>
              <Input
                id="color_code"
                value={formData.color_code || "#000000"}
                onChange={(e) => updateField("color_code", e.target.value)}
                type="color"
                className="bg-slate-700 border-slate-600 text-white h-12"
              />
            </div>
            <div>
              <Label htmlFor="display_order" className="text-slate-300">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order || 0}
                onChange={(e) => updateField("display_order", parseInt(e.target.value) || 0)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => updateField("is_active", checked)}
              />
              <Label htmlFor="is_active" className="text-slate-300">Active</Label>
            </div>
          </div>
        )

      case "questions":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question_text" className="text-slate-300">Question Text</Label>
              <Textarea
                id="question_text"
                value={formData.question_text || ""}
                onChange={(e) => updateField("question_text", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-slate-300">Category</Label>
              <Input
                id="category"
                value={formData.category || ""}
                onChange={(e) => updateField("category", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="difficulty" className="text-slate-300">Difficulty</Label>
              <Select value={formData.difficulty || "medium"} onValueChange={(val) => updateField("difficulty", val)}>
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
            <div>
              <Label htmlFor="points" className="text-slate-300">Points</Label>
              <Input
                id="points"
                type="number"
                value={formData.points || 10}
                onChange={(e) => updateField("points", parseInt(e.target.value) || 10)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        )

      case "options":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="question_id" className="text-slate-300">Question ID</Label>
              <Input
                id="question_id"
                value={formData.question_id || ""}
                onChange={(e) => updateField("question_id", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter question UUID"
              />
            </div>
            <div>
              <Label htmlFor="option_text" className="text-slate-300">Option Text</Label>
              <Textarea
                id="option_text"
                value={formData.option_text || ""}
                onChange={(e) => updateField("option_text", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="display_order" className="text-slate-300">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order || 1}
                onChange={(e) => updateField("display_order", parseInt(e.target.value) || 1)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_correct"
                checked={formData.is_correct ?? false}
                onCheckedChange={(checked) => updateField("is_correct", checked)}
              />
              <Label htmlFor="is_correct" className="text-slate-300">Is Correct Answer</Label>
            </div>
          </div>
        )

      case "referrals":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="referrer_id" className="text-slate-300">Referrer ID</Label>
              <Input
                id="referrer_id"
                value={formData.referrer_id || ""}
                onChange={(e) => updateField("referrer_id", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="referred_user_id" className="text-slate-300">Referred User ID</Label>
              <Input
                id="referred_user_id"
                value={formData.referred_user_id || ""}
                onChange={(e) => updateField("referred_user_id", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="referral_code" className="text-slate-300">Referral Code</Label>
              <Input
                id="referral_code"
                value={formData.referral_code || ""}
                onChange={(e) => updateField("referral_code", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="bonus_points_awarded" className="text-slate-300">Bonus Points</Label>
              <Input
                id="bonus_points_awarded"
                type="number"
                value={formData.bonus_points_awarded || 100}
                onChange={(e) => updateField("bonus_points_awarded", parseInt(e.target.value) || 100)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_rewarded"
                checked={formData.is_rewarded ?? false}
                onCheckedChange={(checked) => updateField("is_rewarded", checked)}
              />
              <Label htmlFor="is_rewarded" className="text-slate-300">Is Rewarded</Label>
            </div>
          </div>
        )

      default:
        return null
    }
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
            <h1 className="text-4xl font-bold text-white mb-2">Database Management</h1>
            <p className="text-slate-400">Manage all system data</p>
          </div>
          <Button onClick={() => router.push("/admin")} variant="outline" className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700">
            Back to Home
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-6 gap-2 bg-slate-800/50 mb-6">
                <TabsTrigger value="profiles" className="data-[state=active]:bg-primary">Profiles</TabsTrigger>
                <TabsTrigger value="categories" className="data-[state=active]:bg-primary">Categories</TabsTrigger>
                <TabsTrigger value="questions" className="data-[state=active]:bg-primary">Questions</TabsTrigger>
                <TabsTrigger value="options" className="data-[state=active]:bg-primary">Options</TabsTrigger>
                <TabsTrigger value="attempts" className="data-[state=active]:bg-primary">Attempts</TabsTrigger>
                <TabsTrigger value="referrals" className="data-[state=active]:bg-primary">Referrals</TabsTrigger>
              </TabsList>

              <div className="mb-4 flex justify-between items-center">
                <Button onClick={() => fetchData(activeTab)} variant="outline" size="sm" className="bg-slate-700/50 border-slate-600 text-white">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                {activeTab !== "attempts" && (
                  <Button onClick={() => openDialog()} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                )}
              </div>

              <TabsContent value="profiles">
                {renderTable(profiles, [
                  { key: "email", label: "Email" },
                  { 
                    key: "first_name", 
                    label: "Name",
                    render: (val, row) => `${row.first_name} ${row.last_name}`
                  },
                  { 
                    key: "role", 
                    label: "Role",
                    render: (val) => (
                      <span className={`px-2 py-1 rounded text-xs ${val === 'admin' ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'}`}>
                        {val}
                      </span>
                    )
                  },
                  { key: "referral_code", label: "Referral Code" },
                  { key: "referral_bonus_points", label: "Bonus Points" },
                ])}
              </TabsContent>

              <TabsContent value="categories">
                {renderTable(categories, [
                  { key: "name", label: "Name" },
                  { 
                    key: "description", 
                    label: "Description",
                    render: (val) => val?.substring(0, 50) + "..."
                  },
                  { 
                    key: "color_code", 
                    label: "Color",
                    render: (val) => (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: val }}></div>
                        <span>{val}</span>
                      </div>
                    )
                  },
                  { key: "display_order", label: "Order" },
                  { 
                    key: "is_active", 
                    label: "Active",
                    render: (val) => val ? "✓" : "✗"
                  },
                ])}
              </TabsContent>

              <TabsContent value="questions">
                {renderTable(questions, [
                  { 
                    key: "question_text", 
                    label: "Question",
                    render: (val) => val.substring(0, 100) + "..."
                  },
                  { key: "category", label: "Category" },
                  { 
                    key: "difficulty", 
                    label: "Difficulty",
                    render: (val) => (
                      <span className={`px-2 py-1 rounded text-xs ${
                        val === 'easy' ? 'bg-green-900/30 text-green-300' : 
                        val === 'medium' ? 'bg-yellow-900/30 text-yellow-300' : 
                        'bg-red-900/30 text-red-300'
                      }`}>
                        {val}
                      </span>
                    )
                  },
                  { key: "points", label: "Points" },
                ])}
              </TabsContent>

              <TabsContent value="options">
                {renderTable(options, [
                  { 
                    key: "question_id", 
                    label: "Question ID",
                    render: (val) => <span className="font-mono text-xs">{val.substring(0, 8)}...</span>
                  },
                  { key: "option_text", label: "Option Text" },
                  { 
                    key: "is_correct", 
                    label: "Correct",
                    render: (val) => val ? "✓" : "✗"
                  },
                  { key: "display_order", label: "Order" },
                ])}
              </TabsContent>

              <TabsContent value="attempts">
                {renderTable(attempts, [
                  { 
                    key: "user_id", 
                    label: "User ID",
                    render: (val) => <span className="font-mono text-xs">{val.substring(0, 8)}...</span>
                  },
                  { 
                    key: "question_id", 
                    label: "Question ID",
                    render: (val) => <span className="font-mono text-xs">{val.substring(0, 8)}...</span>
                  },
                  { 
                    key: "is_correct", 
                    label: "Correct",
                    render: (val) => val ? "✓" : "✗"
                  },
                  { key: "points_earned", label: "Points" },
                  { 
                    key: "attempted_at", 
                    label: "Date",
                    render: (val) => new Date(val).toLocaleDateString()
                  },
                ])}
              </TabsContent>

              <TabsContent value="referrals">
                {renderTable(referrals, [
                  { 
                    key: "referrer_id", 
                    label: "Referrer ID",
                    render: (val) => <span className="font-mono text-xs">{val.substring(0, 8)}...</span>
                  },
                  { 
                    key: "referred_user_id", 
                    label: "Referred User ID",
                    render: (val) => <span className="font-mono text-xs">{val.substring(0, 8)}...</span>
                  },
                  { key: "referral_code", label: "Code" },
                  { key: "bonus_points_awarded", label: "Points" },
                  { 
                    key: "is_rewarded", 
                    label: "Rewarded",
                    render: (val) => val ? "✓" : "✗"
                  },
                ])}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit" : "Add"} {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editMode ? "Update the item details below" : "Create a new item"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {renderForm()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="bg-slate-700 border-slate-600">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary">
              {editMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}