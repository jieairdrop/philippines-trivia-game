"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function PlayerSettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getProfile = async () => {
      const supabase = createClient()

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        router.push("/player/login")
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("id", userData.user.id)
        .single()

      if (profileError) {
        console.error("[v0] Error fetching profile:", profileError)
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
    router.push("/player/login")
  }

  if (loading) {
    return <Loading />
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white">Profile Information</CardTitle>
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
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/player/dashboard")}
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

// ✨ Custom Loading Component
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
          Loading your settings...
        </p>
      </div>
    </div>
  )
}
