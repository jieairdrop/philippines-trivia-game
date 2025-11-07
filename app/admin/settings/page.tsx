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

export default function AdminSettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
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
      setLoading(false)
    }

    getProfile()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
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
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Settings</h1>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white">Admin Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm">Name</label>
              <p className="text-white font-semibold">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Email</label>
              <p className="text-white font-semibold">{profile?.email}</p>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Role</label>
              <p className="text-white font-semibold">Administrator</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/admin/")}
            className="w-full bg-secondary hover:bg-secondary/90 text-white h-12 cursor-pointer"
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={handleLogout}
            className="w-full bg-destructive hover:bg-destructive/90 text-white h-12 cursor-pointer"
          >
            Logout
          </Button>
        </div>
      </div>
    </main>
  )
}
