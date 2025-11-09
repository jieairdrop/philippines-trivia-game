"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LayoutDashboard, 
  Database, 
  Settings, 
  DollarSign,
  Users,
  HelpCircle,
  FolderOpen
} from "lucide-react"

interface AdminProfile {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function AdminHome() {
  const router = useRouter()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [stats, setStats] = useState({ 
    users: 0, 
    questions: 0, 
    attempts: 0,
    categories: 0,
    pendingWithdrawals: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getAdminData = async () => {
      const supabase = createClient()

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

      setProfile(profileData)

      try {
        const [
          { count: usersCount },
          { count: questionsCount },
          { count: attemptsCount },
          { count: categoriesCount },
          { count: pendingWithdrawalsCount }
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("questions").select("*", { count: "exact", head: true }),
          supabase.from("game_attempts").select("*", { count: "exact", head: true }),
          supabase.from("categories").select("*", { count: "exact", head: true }),
          supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending")
        ])

        setStats({
          users: usersCount || 0,
          questions: questionsCount || 0,
          attempts: attemptsCount || 0,
          categories: categoriesCount || 0,
          pendingWithdrawals: pendingWithdrawalsCount || 0
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }

      setLoading(false)
    }

    getAdminData()
  }, [router])

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

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, {profile?.first_name || "Admin"}!
          </h1>
          <p className="text-slate-400">Manage your trivia game platform</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm hover:border-slate-600 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-white text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-400">{stats.users}</p>
              <p className="text-xs text-slate-400 mt-1">Registered players</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm hover:border-slate-600 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-white text-sm font-medium">Questions</CardTitle>
              <HelpCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-400">{stats.questions}</p>
              <p className="text-xs text-slate-400 mt-1">In {stats.categories} categories</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm hover:border-slate-600 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-white text-sm font-medium">Game Attempts</CardTitle>
              <FolderOpen className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-purple-400">{stats.attempts}</p>
              <p className="text-xs text-slate-400 mt-1">Total plays</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Withdrawals Alert */}
        {stats.pendingWithdrawals > 0 && (
          <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-700/50 backdrop-blur-sm mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-300" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {stats.pendingWithdrawals} Pending Withdrawal{stats.pendingWithdrawals > 1 ? 's' : ''}
                    </p>
                    <p className="text-slate-400 text-sm">Action required</p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push("/admin/withdrawals")}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Review Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => router.push("/admin/dashboard")}
            className="bg-gradient-to-br from-primary/80 to-primary border border-primary/50 hover:from-primary hover:to-primary/90 text-white h-24 flex flex-col items-center justify-center gap-2 group"
          >
            <LayoutDashboard className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Full Dashboard</span>
            <span className="text-xs opacity-80">Analytics & Reports</span>
          </Button>

          <Button
            onClick={() => router.push("/admin/manage")}
            className="bg-gradient-to-br from-green-600/80 to-green-700 border border-green-600/50 hover:from-green-600 hover:to-green-700/90 text-white h-24 flex flex-col items-center justify-center gap-2 group"
          >
            <Database className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Manage Data</span>
            <span className="text-xs opacity-80">Users, Questions & More</span>
          </Button>

          <Button
            onClick={() => router.push("/admin/withdrawals")}
            className="bg-gradient-to-br from-orange-600/80 to-orange-700 border border-orange-600/50 hover:from-orange-600 hover:to-orange-700/90 text-white h-24 flex flex-col items-center justify-center gap-2 group relative"
          >
            {stats.pendingWithdrawals > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {stats.pendingWithdrawals}
              </span>
            )}
            <DollarSign className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Withdrawals</span>
            <span className="text-xs opacity-80">Process Requests</span>
          </Button>

          <Button
            onClick={() => router.push("/admin/settings")}
            className="bg-gradient-to-br from-slate-700/80 to-slate-800 border border-slate-600/50 hover:from-slate-700 hover:to-slate-800/90 text-white h-24 flex flex-col items-center justify-center gap-2 group"
          >
            <Settings className="h-6 w-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Settings</span>
            <span className="text-xs opacity-80">System Configuration</span>
          </Button>
        </div>

        {/* Quick Links */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Quick Management Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/manage/users")}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/manage/categories")}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 justify-start"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Categories
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/manage/questions")}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 justify-start"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Questions
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/manage/options")}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 justify-start"
              >
                <Database className="h-4 w-4 mr-2" />
                Options
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/manage/attempts")}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 justify-start"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Attempts
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/manage/referrals")}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Referrals
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}