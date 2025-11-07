"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminProfile {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function AdminHome() {
  const router = useRouter()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [stats, setStats] = useState({ users: 0, questions: 0, attempts: 0 })
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
        const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact" })

        const { count: questionsCount } = await supabase.from("questions").select("*", { count: "exact" })

        const { count: attemptsCount } = await supabase.from("game_attempts").select("*", { count: "exact" })

        setStats({
          users: usersCount || 0,
          questions: questionsCount || 0,
          attempts: attemptsCount || 0,
        })
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
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
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage your trivia game platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent">{stats.users}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.questions}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Game Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent">{stats.attempts}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Button
            onClick={() => router.push("/admin/dashboard")}
            className="bg-primary hover:bg-primary/90 text-white h-12 font-semibold"
          >
            View Full Dashboard
          </Button>
          <Button
            onClick={() => router.push("/admin/settings")}
            className="bg-secondary hover:bg-secondary/90 text-white h-12 font-semibold"
          >
            Settings
          </Button>
        </div>
      </div>
    </main>
  )
}
