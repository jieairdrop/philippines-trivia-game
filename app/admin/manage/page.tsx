"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  HelpCircle, 
  Target, 
  Gift, 
  FolderOpen, 
  List,
  ArrowLeft
} from "lucide-react"

interface Stats {
  users: number
  questions: number
  attempts: number
  categories: number
  referrals: number
  options: number
}

export default function ManagementHubPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    users: 0,
    questions: 0,
    attempts: 0,
    categories: 0,
    referrals: 0,
    options: 0
  })

  useEffect(() => {
    checkAuthAndFetchData()
  }, [])

  const checkAuthAndFetchData = async () => {
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

    await fetchStats()
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const [
        { count: usersCount },
        { count: questionsCount },
        { count: attemptsCount },
        { count: categoriesCount },
        { count: referralsCount },
        { count: optionsCount }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("questions").select("*", { count: "exact", head: true }),
        supabase.from("game_attempts").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("referrals").select("*", { count: "exact", head: true }),
        supabase.from("question_options").select("*", { count: "exact", head: true })
      ])

      setStats({
        users: usersCount || 0,
        questions: questionsCount || 0,
        attempts: attemptsCount || 0,
        categories: categoriesCount || 0,
        referrals: referralsCount || 0,
        options: optionsCount || 0
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const managementCards = [
    {
      title: "Users Management",
      description: "Manage user accounts, roles, and profiles",
      icon: Users,
      count: stats.users,
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
      route: "/admin/manage/users"
    },
    {
      title: "Categories",
      description: "Manage quiz categories and topics",
      icon: FolderOpen,
      count: stats.categories,
      color: "text-purple-400",
      bgColor: "bg-purple-900/20",
      route: "/admin/manage/categories"
    },
    {
      title: "Questions",
      description: "Manage trivia questions and answers",
      icon: HelpCircle,
      count: stats.questions,
      color: "text-green-400",
      bgColor: "bg-green-900/20",
      route: "/admin/manage/questions"
    },
    {
      title: "Question Options",
      description: "Manage answer options for questions",
      icon: List,
      count: stats.options,
      color: "text-yellow-400",
      bgColor: "bg-yellow-900/20",
      route: "/admin/manage/options"
    },
    {
      title: "Game Attempts",
      description: "View all game attempts and statistics",
      icon: Target,
      count: stats.attempts,
      color: "text-orange-400",
      bgColor: "bg-orange-900/20",
      route: "/admin/manage/attempts"
    },
    {
      title: "Referrals",
      description: "Manage referral system and bonuses",
      icon: Gift,
      count: stats.referrals,
      color: "text-pink-400",
      bgColor: "bg-pink-900/20",
      route: "/admin/manage/referrals"
    }
  ]

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
            <p className="text-slate-400">Manage all system data and content</p>
          </div>
          <Button 
            onClick={() => router.push("/admin/dashboard")} 
            variant="outline" 
            className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementCards.map((card) => {
            const Icon = card.icon
            return (
              <Card 
                key={card.route}
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm hover:border-slate-600 transition-all cursor-pointer group"
                onClick={() => router.push(card.route)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${card.bgColor} group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-white mt-4">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm mb-3">{card.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-slate-300">{card.count}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-primary hover:text-primary/80 hover:bg-primary/10"
                    >
                      Manage →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </main>
  )
}