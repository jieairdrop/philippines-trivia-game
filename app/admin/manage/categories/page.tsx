"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Pencil, Trash2, RefreshCw, ArrowUp, ArrowDown, Code, LogOut, Settings, LayoutDashboard, Users2, Award, ChevronDown, FolderKanban, LucideWallet2, Database, HelpCircle, FolderOpen, List, Wallet2, Gift, Target } from "lucide-react"
import Link from "next/link"

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

export default function CategoriesManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState<Category | null>(null)
  const [formData, setFormData] = useState<any>({})
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [svgPreview, setSvgPreview] = useState("")
  
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

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  useEffect(() => {
    if (dialogOpen && formData.icon_svg) {
      setSvgPreview(formData.icon_svg)
    }
  }, [formData.icon_svg, dialogOpen])

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
    await fetchCategories()
    setLoading(false)
  }

  const fetchCategories = async () => {
    setError("")
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (err: any) {
      setError(err.message || "Failed to fetch categories")
    }
  }

  const openDialog = (item: Category | null = null) => {
    setCurrentItem(item)
    setEditMode(!!item)
    setFormData(item || { 
      is_active: true, 
      display_order: categories.length + 1,
      color_code: "#3b82f6",
      icon_svg: ""
    })
    setSvgPreview(item?.icon_svg || "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    
    if (!formData.name) {
      setError("Category name is required")
      return
    }

    if (!formData.icon_svg) {
      setError("Category icon (SVG) is required")
      return
    }
    
    try {
      if (editMode && currentItem) {
        const { error } = await supabase
          .from("categories")
          .update(formData)
          .eq("id", currentItem.id)

        if (error) throw error
        setSuccess("Category updated successfully")
      } else {
        const { error } = await supabase
          .from("categories")
          .insert(formData)

        if (error) throw error
        setSuccess("Category created successfully")
      }
      
      setDialogOpen(false)
      await fetchCategories()
      
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save category")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This may affect related questions.")) return

    setError("")
    setSuccess("")
    
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id)
      if (error) throw error
      
      setSuccess("Category deleted successfully")
      await fetchCategories()
      
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to delete category")
    }
  }

  const moveCategory = async (category: Category, direction: "up" | "down") => {
    const currentIndex = categories.findIndex(c => c.id === category.id)
    if (
      (direction === "up" && currentIndex === 0) || 
      (direction === "down" && currentIndex === categories.length - 1)
    ) {
      return
    }

    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const swapCategory = categories[swapIndex]

    try {
      await supabase.from("categories").update({ display_order: swapCategory.display_order }).eq("id", category.id)
      await supabase.from("categories").update({ display_order: category.display_order }).eq("id", swapCategory.id)
      await fetchCategories()
    } catch (err: any) {
      setError("Failed to reorder categories")
    }
  }

  const renderSvgIcon = (svgString: string, size: number = 48) => {
    try {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: svgString }}
          className="w-full h-full flex items-center justify-center"
          style={{
            width: `${size}px`,
            height: `${size}px`
          }}
        />
      )
    } catch {
      return <Code className="h-full w-full" />
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-slate-300">Loading categories...</div>
        </div>
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
                Categories Management
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
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white bg-purple-950/50 transition-all duration-200 text-sm font-medium group">
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
      <main className="relative z-10 max-w-[90rem] mx-auto px-6 py-8">
        {error && (
          <Alert className="mb-4 bg-red-950/50 border-red-800/50 shadow-lg shadow-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-emerald-950/50 border-emerald-800/50 shadow-lg shadow-emerald-500/10">
            <AlertDescription className="text-emerald-200">{success}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800/40 backdrop-blur-sm shadow-2xl mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-slate-300 font-medium">
                Total categories: <span className="text-blue-400 font-bold">{categories.length}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={fetchCategories} 
                  variant="outline" 
                  className="bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button 
                  onClick={() => openDialog()} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <Card 
                  key={category.id}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: category.color_code + "20", border: `2px solid ${category.color_code}` }}
                      >
                        {category.icon_svg ? renderSvgIcon(category.icon_svg, 40) : <Code className="h-6 w-6 text-slate-400" />}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveCategory(category, "up")}
                          disabled={index === 0}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveCategory(category, "down")}
                          disabled={index === categories.length - 1}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">{category.name}</h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-10">
                      {category.description || "No description provided"}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/50">
                      <span className="text-xs text-slate-500 font-medium">Order: <span className="text-blue-400">{category.display_order}</span></span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        category.is_active 
                          ? 'bg-emerald-950/60 border border-emerald-800/50 text-emerald-300' 
                          : 'bg-red-950/60 border border-red-800/50 text-red-300'
                      }`}>
                        {category.is_active ? "✓ Active" : "✗ Inactive"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog(category)}
                        className="flex-1 bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition-all duration-300"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(category.id)}
                        className="bg-red-950/30 border-red-800/50 text-red-300 hover:bg-red-900/50 hover:border-red-700/50 transition-all duration-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {categories.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Code className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg font-medium">No categories found</p>
                  <p className="text-slate-500 text-sm mt-1">Create your first category to get started.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 text-white max-w-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {editMode ? "Edit" : "Create"} Category
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editMode ? "Update category details and settings" : "Create a new quiz category with custom branding"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
            <div>
              <Label htmlFor="name" className="text-slate-300 font-semibold mb-2 block">
                Category Name *
              </Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                placeholder="e.g., Science, History, Sports"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-slate-300 font-semibold mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all resize-none"
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color_code" className="text-slate-300 font-semibold mb-2 block">
                  Color
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="color_code"
                    type="color"
                    value={formData.color_code || "#3b82f6"}
                    onChange={(e) => setFormData({...formData, color_code: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white h-12 cursor-pointer"
                  />
                  <span className="text-slate-400 text-sm">{formData.color_code || "#3b82f6"}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="display_order" className="text-slate-300 font-semibold mb-2 block">
                  Display Order
                </Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order || 1}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 1})}
                  className="bg-slate-800/50 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="icon_svg" className="text-slate-300 font-semibold mb-2 block flex items-center gap-2">
                <Code className="w-4 h-4" />
                Icon SVG *
              </Label>
              <Textarea
                id="icon_svg"
                value={formData.icon_svg || ""}
                onChange={(e) => {
                  setFormData({...formData, icon_svg: e.target.value})
                  setSvgPreview(e.target.value)
                }}
                className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all font-mono text-sm resize-none"
                placeholder='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">...</svg>'
                rows={5}
              />
              <p className="text-xs text-slate-500 mt-2">
                Paste your SVG code here. The icon will be rendered with currentColor, so you can use that for dynamic coloring.
              </p>
            </div>

            {svgPreview && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <p className="text-slate-300 font-semibold mb-3 text-sm">SVG Preview</p>
                <div className="flex items-center justify-center p-4 bg-slate-900/50 rounded-lg">
                  <div 
                    className="w-20 h-20 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: formData.color_code + "20", 
                      border: `2px solid ${formData.color_code}`
                    }}
                  >
                    {renderSvgIcon(svgPreview, 48)}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
              <Checkbox
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <div>
                <Label htmlFor="is_active" className="text-slate-300 font-semibold cursor-pointer">
                  Active Category
                </Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  When active, this category will be visible to users
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-slate-800">
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)} 
              className="bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25"
            >
              {editMode ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}