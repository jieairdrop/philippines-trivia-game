"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Category {
  id: string
  name: string
  description: string
  icon_svg: string
  color_code: string
  display_order: number
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const initPage = async () => {
      const supabase = createClient()

      try {
        // Check authentication
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData.user) {
          router.push("/player/login")
          return
        }

        setUser({ id: authData.user.id, email: authData.user.email || "" })

        // Fetch categories
        const { data: categoriesData, error: cError } = await supabase
          .from("categories")
          .select("id, name, description, icon_svg, color_code, display_order")
          .eq("is_active", true)
          .order("display_order", { ascending: true })

        if (cError) throw cError

        setCategories(categoriesData || [])
      } catch (error) {
        console.error("Error loading categories:", error)
        router.push("/player/dashboard")
      } finally {
        setLoading(false)
      }
    }

    initPage()
  }, [router])

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId)
    const category = categories.find((c) => c.id === categoryId)
    if (category) {
      router.push(`/player/game?category=${categoryId}`)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Background Glow Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 relative z-10">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            href="/player/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <span className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PH Trivia
              </span>
            </span>
          </Link>
          <div className="flex gap-2">
            <Link href="/player/dashboard">
              <Button variant="ghost" className="text-slate-300 hover:bg-slate-800">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Category
            </span>
          </h1>
          <p className="text-slate-400 text-lg">
            Select a category to test your Philippines knowledge
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleSelectCategory(category.id)}
                disabled={selectedCategory === category.id}
                className="group text-left focus:outline-none transition-all"
              >
                <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-700 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full group-hover:shadow-lg group-hover:shadow-primary/10 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div 
                        className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                        style={{ color: category.color_code }}
                        dangerouslySetInnerHTML={{ __html: category.icon_svg }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color_code }}
                        title={`Color: ${category.color_code}`}
                      ></div>
                    </div>
                    <CardTitle className="text-white text-xl group-hover:text-primary transition">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400 text-sm group-hover:text-slate-300 transition">
                      {category.description}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 to-primary/70 text-white font-semibold h-10 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={selectedCategory === category.id}
                      >
                        {selectedCategory === category.id ? "Loading..." : "Play Now"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        ) : (
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm text-center p-12">
            <p className="text-slate-400 text-lg">
              No categories available yet. Please check back soon!
            </p>
          </Card>
        )}

        {/* Quick Play */}
        <div className="text-center">
          <p className="text-slate-400 mb-4">Not sure which to choose?</p>
          <Link href="/player/game">
            <Button className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 to-accent/70 text-slate-900 font-semibold h-12 px-8">
              Quick Play Random
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

/* -------------------------------
 * Loading Component
 * ----------------------------- */
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>

      {/* Spinner */}
      <div className="relative flex flex-col items-center space-y-4 z-10">
        <div className="h-14 w-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-300 text-sm animate-pulse tracking-wide">
          Loading categories...
        </p>
      </div>
    </div>
  )
}
