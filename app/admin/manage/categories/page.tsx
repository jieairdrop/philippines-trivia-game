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
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Plus, Pencil, Trash2, RefreshCw, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react"

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
  const [categories, setCategories] = useState<Category[]>([])
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState<Category | null>(null)
  const [formData, setFormData] = useState<any>({})
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

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
      color_code: "#3b82f6"
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setError("")
    setSuccess("")
    
    if (!formData.name) {
      setError("Category name is required")
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
            <h1 className="text-4xl font-bold text-white mb-2">Categories Management</h1>
            <p className="text-slate-400">Manage quiz categories and topics</p>
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
            <div className="flex justify-between items-center mb-6">
              <div className="text-slate-300">
                Total categories: {categories.length}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={fetchCategories} 
                  variant="outline" 
                  className="bg-slate-700/50 border-slate-600 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => openDialog()} className="bg-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category, index) => (
                <Card 
                  key={category.id}
                  className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: category.color_code }}
                      >
                        {category.icon_svg || "📁"}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveCategory(category, "up")}
                          disabled={index === 0}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveCategory(category, "down")}
                          disabled={index === categories.length - 1}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2">{category.name}</h3>
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                      {category.description || "No description"}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500">Order: {category.display_order}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        category.is_active 
                          ? 'bg-green-900/30 text-green-300' 
                          : 'bg-red-900/30 text-red-300'
                      }`}>
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDialog(category)}
                        className="flex-1 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(category.id)}
                        className="bg-red-900/20 border-red-700 text-red-300 hover:bg-red-900/30"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {categories.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  No categories found. Create your first category to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit" : "Create"} Category</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editMode ? "Update category details" : "Create a new quiz category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Category Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="e.g., Science, History, Sports"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-slate-300">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon_svg" className="text-slate-300">Icon (Emoji)</Label>
                <Input
                  id="icon_svg"
                  value={formData.icon_svg || ""}
                  onChange={(e) => setFormData({...formData, icon_svg: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white text-2xl text-center"
                  placeholder="📚"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="color_code" className="text-slate-300">Color</Label>
                <Input
                  id="color_code"
                  type="color"
                  value={formData.color_code || "#3b82f6"}
                  onChange={(e) => setFormData({...formData, color_code: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white h-10"
                />
              </div>
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
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="is_active" className="text-slate-300">Active (visible to users)</Label>
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
              {editMode ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}